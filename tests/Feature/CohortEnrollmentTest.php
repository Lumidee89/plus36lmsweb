<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CohortEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    private function course(): Course
    {
        return Course::create(['user_id' => User::factory()->create(['role' => 'tutor'])->id, 'faculty_id' => Faculty::firstOrCreate(['name' => 'Tech'])->id, 'title' => 'Web development', 'description' => 'Learn', 'price' => 9000, 'duration' => '4 weeks', 'status' => 'published']);
    }

    private function cohort(float $price = 0, int $capacity = 1): int
    {
        return DB::table('cohorts')->insertGetId(['course_id' => $course = $this->course()->id, 'tutor_id' => Course::find($course)->user_id, 'name' => 'September', 'starts_on' => today(), 'ends_on' => today()->addMonth(), 'capacity' => $capacity, 'price' => $price, 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
    }

    public function test_admin_sets_independent_fee_and_required_capacity(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $data = ['course_id' => $this->course()->id, 'name' => 'Autumn', 'starts_on' => today()->toDateString(), 'capacity' => 12, 'price' => 2500];
        $this->actingAs($admin)->postJson('/platform/cohorts', $data)->assertCreated()->assertJsonPath('cohort.capacity', 12);
        $this->assertDatabaseHas('cohorts', ['name' => 'Autumn', 'price' => 2500, 'capacity' => 12]);
        $this->postJson('/platform/cohorts', [...$data, 'capacity' => 0])->assertUnprocessable()->assertJsonValidationErrors('capacity');
        $this->postJson('/platform/cohorts', [...$data, 'price' => -1])->assertUnprocessable()->assertJsonValidationErrors('price');
        $this->actingAs(User::factory()->create(['role' => 'student']))->postJson('/api/cohorts', $data)->assertForbidden();
    }

    public function test_students_discover_cohorts_and_last_seat_cannot_be_reused(): void
    {
        $id = $this->cohort();
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->getJson('/api/cohorts')->assertOk()->assertJsonPath('cohorts.0.remaining_seats', 1)->assertJsonPath('cohorts.0.is_enrolled', false);
        $this->postJson("/api/cohorts/$id/join")->assertOk()->assertJsonPath('enrolled', true);
        $this->postJson("/api/cohorts/$id/join")->assertOk();
        $this->assertDatabaseCount('cohort_students', 1);
        $this->assertDatabaseCount('enrollments', 1);
        $this->getJson('/api/cohorts')->assertJsonPath('cohorts.0.is_enrolled', true)->assertJsonPath('cohorts.0.is_full', true);
        $this->actingAs(User::factory()->create(['role' => 'student']))->postJson("/cohorts/$id/join")->assertConflict();
        $this->assertDatabaseCount('cohort_students', 1);
    }

    public function test_closed_unknown_and_other_organization_cohorts_cannot_be_joined(): void
    {
        $id = $this->cohort();
        $this->actingAs(User::factory()->create(['role' => 'student']));
        $this->postJson('/api/cohorts/9999/join')->assertNotFound();
        DB::table('cohorts')->where('id', $id)->update(['status' => 'draft']);
        $this->postJson("/api/cohorts/$id/join")->assertUnprocessable();
        DB::table('cohorts')->where('id', $id)->update(['status' => 'active', 'ends_on' => today()->subDay()]);
        $this->postJson("/api/cohorts/$id/join")->assertUnprocessable();
        $org = DB::table('organizations')->insertGetId(['name' => 'Private', 'slug' => 'private', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('cohorts')->where('id', $id)->update(['organization_id' => $org]);
        $this->getJson('/api/cohorts')->assertJsonCount(0, 'cohorts');
        $this->postJson("/api/cohorts/$id/join")->assertForbidden();
    }

    private function fakePayment(string $email, int $amount = 250000, string $status = 'success'): void
    {
        config(['services.paystack.secret_key' => 'test-secret']);
        Http::fake([
            'api.paystack.co/transaction/initialize' => Http::response(['status' => true, 'data' => ['authorization_url' => 'https://checkout.paystack.com/test']]),
            'api.paystack.co/transaction/verify/*' => function ($request) use ($email, $amount, $status) {
                return Http::response(['status' => true, 'data' => ['reference' => basename($request->url()), 'status' => $status, 'currency' => 'NGN', 'amount' => $amount, 'customer' => ['email' => $email]]]);
            },
            'api.paystack.co/refund' => Http::response(['status' => true]),
        ]);
    }

    public function test_paid_checkout_reserves_seat_verifies_payment_and_is_idempotent(): void
    {
        $id = $this->cohort(2500);
        $student = User::factory()->create(['role' => 'student']);
        $this->fakePayment($student->email);
        $reference = $this->actingAs($student)->postJson("/api/cohorts/$id/join", ['amount' => 1])->assertOk()->json('reference');
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/initialize') && $request['amount'] === 250000);
        $this->assertDatabaseCount('enrollments', 0);
        $other = User::factory()->create(['role' => 'student']);
        $this->actingAs($other)->postJson("/api/cohorts/$id/join")->assertConflict();
        $this->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertForbidden();
        $this->actingAs($student)->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertOk()->assertJsonPath('enrolled', true);
        $this->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertOk();
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('cohort_students', 1);
        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'amount_paid' => 2500]);
    }

    public function test_underpayment_does_not_grant_enrollment(): void
    {
        $id = $this->cohort(2500);
        $student = User::factory()->create(['role' => 'student']);
        $this->fakePayment($student->email, 1);
        $reference = $this->actingAs($student)->postJson("/api/cohorts/$id/join")->json('reference');
        $this->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertUnprocessable();
        $this->assertDatabaseCount('cohort_students', 0);
    }

    public function test_late_payment_for_full_cohort_requests_refund_instead_of_oversubscribing(): void
    {
        $id = $this->cohort(2500);
        $student = User::factory()->create(['role' => 'student']);
        $this->fakePayment($student->email);
        $reference = $this->actingAs($student)->postJson("/api/cohorts/$id/join")->json('reference');
        $this->travel(31)->minutes();
        DB::table('cohort_students')->insert(['cohort_id' => $id, 'user_id' => User::factory()->create(['role' => 'student'])->id]);
        $this->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertOk()->assertJsonPath('enrolled', false);
        $this->assertDatabaseHas('cohort_checkouts', ['reference' => $reference, 'status' => 'refund_requested']);
        $this->assertDatabaseCount('cohort_students', 1);
        $this->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertOk();
        Http::assertSentCount(3);
    }

    public function test_signed_webhook_completes_payment_without_the_app_open(): void
    {
        $id = $this->cohort(2500);
        $student = User::factory()->create(['role' => 'student']);
        $this->fakePayment($student->email);
        $reference = $this->actingAs($student)->postJson("/api/cohorts/$id/join")->json('reference');
        $body = json_encode(['event' => 'charge.success', 'data' => ['reference' => $reference]]);
        $signature = hash_hmac('sha512', $body, 'test-secret');
        $this->call('POST', '/api/cohort-payments/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $signature], $body)->assertOk();
        $this->assertDatabaseCount('cohort_students', 1);
        $this->get('/cohort-payment/return?reference='.$reference)->assertOk();
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_expired_reservations_release_seats_and_failed_payments_do_not_enroll(): void
    {
        $id = $this->cohort(2500);
        $student = User::factory()->create(['role' => 'student']);
        $this->fakePayment($student->email, 250000, 'failed');
        $reference = $this->actingAs($student)->postJson("/api/cohorts/$id/join")->json('reference');
        $this->postJson("/api/cohorts/$id/verify", ['reference' => $reference])->assertUnprocessable();
        $this->assertDatabaseCount('cohort_students', 0);
        $this->travel(31)->minutes();
        $this->getJson('/api/cohorts')->assertJsonPath('cohorts.0.remaining_seats', 1);
    }

    public function test_existing_course_access_is_not_duplicated(): void
    {
        $id = $this->cohort();
        $student = User::factory()->create(['role' => 'student']);
        Enrollment::create(['user_id' => $student->id, 'course_id' => DB::table('cohorts')->find($id)->course_id, 'amount_paid' => 9000]);
        $this->actingAs($student)->postJson("/api/cohorts/$id/join")->assertOk();
        $this->assertDatabaseCount('enrollments', 1);
        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'amount_paid' => 9000]);
    }

    public function test_homepage_exposes_public_cohorts(): void
    {
        $this->cohort();
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->component('Home')->has('cohorts', 1)->where('cohorts.0.name', 'September'));
    }

    public function test_admin_can_edit_and_delete_cohorts_without_losing_course_access(): void
    {
        $id = $this->cohort();
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->postJson("/api/cohorts/$id/join")->assertOk();
        $admin = User::factory()->create(['role' => 'admin']);
        $row = (array) DB::table('cohorts')->find($id);
        $this->actingAs($admin)->patchJson("/platform/cohorts/$id", [...$row, 'name' => 'Updated cohort', 'price' => 500, 'capacity' => 5])->assertOk();
        $this->assertDatabaseHas('cohorts', ['id' => $id, 'name' => 'Updated cohort', 'price' => 500, 'capacity' => 5]);
        $this->patchJson("/platform/cohorts/$id", [...$row, 'course_id' => $this->course()->id])->assertUnprocessable();
        $this->deleteJson("/platform/cohorts/$id")->assertOk();
        $this->assertDatabaseHas('cohorts', ['id' => $id, 'status' => 'deleted']);
        $this->assertDatabaseCount('enrollments', 1);
        $this->assertCount(0, app(\App\Services\CohortService::class)->listing($admin));
        $this->actingAs($student)->getJson('/api/cohorts')->assertJsonCount(0, 'cohorts');
        $this->postJson("/api/cohorts/$id/join")->assertUnprocessable();
    }

    public function test_capacity_cannot_drop_below_reserved_seats_and_members(): void
    {
        $id = $this->cohort(2500, 3);
        $student = User::factory()->create(['role' => 'student']);
        $this->fakePayment($student->email);
        $this->actingAs($student)->postJson("/api/cohorts/$id/join")->assertOk();
        DB::table('cohort_students')->insert(['cohort_id' => $id, 'user_id' => User::factory()->create(['role' => 'student'])->id]);
        $row = (array) DB::table('cohorts')->find($id);
        $this->actingAs(User::factory()->create(['role' => 'admin']))->patchJson("/platform/cohorts/$id", [...$row, 'capacity' => 1])->assertUnprocessable();
        $this->assertDatabaseHas('cohorts', ['id' => $id, 'capacity' => 3]);
    }

    public function test_management_is_restricted_to_authorized_admins(): void
    {
        $id = $this->cohort();
        $row = (array) DB::table('cohorts')->find($id);
        $this->actingAs(User::factory()->create(['role' => 'student']))->patchJson("/platform/cohorts/$id", $row)->assertForbidden();
        $this->deleteJson("/platform/cohorts/$id")->assertForbidden();
        $org = DB::table('organizations')->insertGetId(['name' => 'Other', 'slug' => 'other', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs(User::factory()->create(['role' => 'admin', 'organization_id' => $org]))->patchJson("/platform/cohorts/$id", $row)->assertForbidden();
        $this->deleteJson("/platform/cohorts/$id")->assertForbidden();
    }

    public function test_cohort_course_appears_on_mobile_and_web_and_tutor_roster(): void
    {
        $id = $this->cohort();
        $cohort = DB::table('cohorts')->find($id);
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->postJson("/api/cohorts/$id/join")->assertOk();
        $this->getJson('/api/courses/enrolled')->assertOk()->assertJsonPath('courses.0.id', $cohort->course_id);
        $this->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->component('Dashboard')->where('enrolledCourses.0.id', $cohort->course_id));
        $this->getJson('/api/tutor/cohorts')->assertForbidden();
        $this->actingAs(User::find($cohort->tutor_id))->getJson('/api/tutor/cohorts')->assertOk()->assertJsonPath('cohorts.0.students.0.id', $student->id);
        $this->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->component('Dashboard')->where('tutor_cohorts.0.students.0.id', $student->id));
        $this->actingAs(User::factory()->create(['role' => 'tutor']))->getJson('/api/tutor/cohorts')->assertOk()->assertJsonCount(0, 'cohorts');
    }

    public function test_legacy_memberships_receive_course_access_without_duplicate_or_payment_changes(): void
    {
        $id = $this->cohort();
        $cohort = DB::table('cohorts')->find($id);
        $student = User::factory()->create(['role' => 'student']);
        DB::table('cohort_students')->insert(['cohort_id' => $id, 'user_id' => $student->id]);
        $migration = require database_path('migrations/2026_09_16_000001_backfill_cohort_course_access.php');
        $migration->up();
        $this->assertDatabaseHas('enrollments', ['course_id' => $cohort->course_id, 'user_id' => $student->id]);
        DB::table('enrollments')->where('user_id', $student->id)->update(['amount_paid' => 4000]);
        $migration->up();
        $this->assertDatabaseCount('enrollments', 1);
        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'amount_paid' => 4000]);
    }

    public function test_course_list_repairs_legacy_cohort_access_without_running_backfill(): void
    {
        $id = $this->cohort();
        $courseId = DB::table('cohorts')->find($id)->course_id;
        $student = User::factory()->create(['role' => 'student']);
        DB::table('cohort_students')->insert(['cohort_id' => $id, 'user_id' => $student->id]);
        $this->assertDatabaseCount('enrollments', 0);
        $this->actingAs($student)->getJson('/api/courses/enrolled')->assertOk()->assertJsonPath('courses.0.id', $courseId)->assertJsonPath('courses.0.is_enrolled', true)->assertJsonPath('courses.0.enrolled_cohorts.0.id', $id)->assertJsonPath('courses.0.enrolled_cohorts.0.name', 'September');
        $this->getJson('/api/courses/enrolled')->assertOk()->assertJsonCount(1, 'courses');
        $this->assertDatabaseCount('enrollments', 1);
        $this->actingAs(User::factory()->create(['role' => 'student']))->getJson('/api/courses/enrolled')->assertOk()->assertJsonCount(0, 'courses');
    }

    public function test_web_dashboard_repairs_legacy_cohort_access(): void
    {
        $id = $this->cohort();
        $courseId = DB::table('cohorts')->find($id)->course_id;
        $student = User::factory()->create(['role' => 'student']);
        DB::table('cohort_students')->insert(['cohort_id' => $id, 'user_id' => $student->id]);
        $this->actingAs($student)->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->component('Dashboard')->where('enrolledCourses.0.id', $courseId));
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_regular_courses_have_no_cohort_labels(): void
    {
        $course = $this->course();
        $student = User::factory()->create(['role' => 'student']);
        \App\Models\Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'amount_paid' => 9000]);
        $this->actingAs($student)->getJson('/api/courses/enrolled')->assertOk()
            ->assertJsonPath('courses.0.id', $course->id)->assertJsonCount(0, 'courses.0.enrolled_cohorts');
    }

    public function test_webhook_rejects_unsigned_requests(): void
    {
        config(['services.paystack.secret_key' => 'test-secret']);
        $this->postJson('/api/cohort-payments/webhook', ['event' => 'charge.success'])->assertUnauthorized();
    }
}
