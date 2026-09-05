<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_role_receives_the_shared_dashboard(): void
    {
        foreach (['student', 'tutor', 'admin'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user)
                ->get('/dashboard')
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Dashboard')
                    ->where('auth.user.role', $role)
                    ->has('stats'));
        }
    }

    public function test_students_cannot_access_course_authoring_routes(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)->post('/courses')->assertForbidden();
        $this->actingAs($student)->post('/lessons')->assertForbidden();
        $this->actingAs($student)->post('/topics')->assertForbidden();
    }

    public function test_only_students_can_access_enrollment_and_progress_routes(): void
    {
        $tutor = User::factory()->create(['role' => 'tutor']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($tutor)->post('/courses/enroll')->assertForbidden();
        $this->actingAs($admin)->get('/progress')->assertForbidden();
    }

    public function test_only_tutors_can_request_withdrawals_or_manage_exams(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($student)->post('/withdrawals')->assertForbidden();
        $this->actingAs($admin)->post('/exams')->assertForbidden();
    }
}
