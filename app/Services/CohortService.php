<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class CohortService
{
    public function restoreCourseAccess(User $user): void
    {
        if ($user->role !== 'student') return;
        $courseIds = DB::table('cohort_students as cs')->join('cohorts as c', 'c.id', '=', 'cs.cohort_id')
            ->where('cs.user_id', $user->id)
            ->whereNotExists(fn ($q) => $q->selectRaw('1')->from('enrollments')->where('enrollments.user_id', $user->id)->whereColumn('enrollments.course_id', 'c.course_id'))
            ->distinct()->pluck('c.course_id');
        if ($courseIds->isEmpty()) return;
        DB::transaction(function () use ($user, $courseIds) {
            User::whereKey($user->id)->lockForUpdate()->first();
            foreach ($courseIds as $courseId) {
                Enrollment::firstOrCreate(['user_id' => $user->id, 'course_id' => $courseId], ['amount_paid' => 0]);
            }
        });
    }

    public function listing(?User $user = null)
    {
        $query = DB::table('cohorts as c')->join('courses', 'courses.id', '=', 'c.course_id')
            ->where('c.status', '!=', 'deleted')
            ->select('c.*', 'courses.title as course_title')
            ->selectSub(DB::table('cohort_students')->selectRaw('COUNT(*)')->whereColumn('cohort_id', 'c.id'), 'enrolled_count')
            ->selectSub(DB::table('cohort_checkouts')->selectRaw('COUNT(*)')->whereColumn('cohort_id', 'c.id')->where('status', 'pending')->where('expires_at', '>', now()), 'reserved_count');
        if ($user?->role === 'admin') {
            $query->when($user->organization_id, fn ($q) => $q->where('c.organization_id', $user->organization_id));
        } elseif ($user?->role === 'tutor') {
            $query->where('c.tutor_id', $user->id);
        } else {
            $query->where('c.status', 'active')->where('courses.status', 'published')
                ->where(fn ($q) => $q->whereNull('c.organization_id')->when($user?->organization_id, fn ($q) => $q->orWhere('c.organization_id', $user->organization_id)))
                ->where(fn ($q) => $q->whereNull('courses.organization_id')->when($user?->organization_id, fn ($q) => $q->orWhere('courses.organization_id', $user->organization_id)));
        }
        $joined = $user ? DB::table('cohort_students')->where('user_id', $user->id)->pluck('cohort_id')->all() : [];
        $pending = $user ? DB::table('cohort_checkouts')->where('user_id', $user->id)->where('status', 'pending')->where('expires_at', '>', now())->pluck('cohort_id')->all() : [];

        return $query->orderBy('c.starts_on')->get()->map(function ($cohort) use ($joined, $pending) {
            $cohort->is_enrolled = in_array($cohort->id, $joined);
            $cohort->has_pending_checkout = in_array($cohort->id, $pending);
            $cohort->remaining_seats = $cohort->capacity === null ? null : max(0, $cohort->capacity - $cohort->enrolled_count - $cohort->reserved_count);
            $cohort->is_full = $cohort->remaining_seats === 0;
            $cohort->is_closed = $cohort->status !== 'active' || ($cohort->ends_on && $cohort->ends_on < today()->toDateString());

            return $cohort;
        });
    }

    public function tutorRoster(User $user)
    {
        abort_unless($user->role === 'tutor', 403);
        $cohorts = DB::table('cohorts as c')->join('courses', 'courses.id', '=', 'c.course_id')
            ->where('c.tutor_id', $user->id)->where('c.status', '!=', 'deleted')
            ->select('c.id', 'c.name', 'c.starts_on', 'c.ends_on', 'c.capacity', 'c.status', 'courses.title as course_title')
            ->orderByDesc('c.starts_on')->get();
        $students = DB::table('cohort_students as cs')->join('users', 'users.id', '=', 'cs.user_id')
            ->whereIn('cs.cohort_id', $cohorts->pluck('id'))
            ->select('cs.cohort_id', 'users.id', 'users.name', 'users.email', 'cs.created_at as enrolled_at')
            ->orderBy('users.name')->get()->groupBy('cohort_id');
        return $cohorts->map(function ($cohort) use ($students) {
            $cohort->students = $students->get($cohort->id, collect())->values();
            $cohort->enrolled_count = $cohort->students->count();
            return $cohort;
        });
    }

    private function available(User $user, int $id)
    {
        abort_unless($user->role === 'student', 403);
        $cohort = DB::table('cohorts')->where('id', $id)->lockForUpdate()->first();
        abort_unless($cohort, 404);
        $course = DB::table('courses')->find($cohort->course_id);
        foreach ([$cohort, $course] as $item) {
            abort_if($item->organization_id && $item->organization_id !== $user->organization_id, 403);
        }
        abort_unless($cohort->status === 'active' && $course->status === 'published', 422, 'This cohort is not open for enrollment.');
        abort_if($cohort->ends_on && $cohort->ends_on < today()->toDateString(), 422, 'This cohort has ended.');

        return $cohort;
    }

    private function hasRoom(object $cohort, ?int $exceptCheckout = null): bool
    {
        if ($cohort->capacity === null) {
            return true;
        }
        $enrolled = DB::table('cohort_students')->where('cohort_id', $cohort->id)->count();
        $reserved = DB::table('cohort_checkouts')->where('cohort_id', $cohort->id)->where('status', 'pending')->where('expires_at', '>', now())
            ->when($exceptCheckout, fn ($q) => $q->where('id', '!=', $exceptCheckout))->count();

        return $enrolled + $reserved < $cohort->capacity;
    }

    private function grant(User $user, object $cohort, float $amount): void
    {
        // Lock the user as well: two different cohorts may grant the same course.
        User::whereKey($user->id)->lockForUpdate()->first();
        DB::table('cohort_students')->insert(['cohort_id' => $cohort->id, 'user_id' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
        $enrollment = Enrollment::firstOrCreate(['course_id' => $cohort->course_id, 'user_id' => $user->id], ['amount_paid' => 0]);
        if ($amount > 0) {
            $enrollment->increment('amount_paid', $amount);
        }
        Activity::create(['user_id' => $user->id, 'type' => 'enrollment', 'description' => 'Joined cohort "'.$cohort->name.'"']);
    }

    public function checkout(User $user, int $id): array
    {
        abort_unless($user->role === 'student', 403);
        $previous = DB::table('cohort_checkouts')->where('cohort_id', $id)->where('user_id', $user->id)->whereIn('status', ['pending', 'refund_pending'])->latest('id')->first();
        if ($previous) {
            try {
                return $this->complete($previous->reference, $user);
            } catch (HttpExceptionInterface $error) {
                if ($error->getStatusCode() !== 422 || $error->getMessage() !== 'Payment has not been confirmed. You can retry after completing payment.') {
                    throw $error;
                }
            }
        }

        return DB::transaction(function () use ($user, $id) {
            $cohort = $this->available($user, $id);
            if (DB::table('cohort_students')->where('cohort_id', $id)->where('user_id', $user->id)->exists()) {
                return ['enrolled' => true, 'message' => 'Already enrolled in this cohort.'];
            }
            $pending = DB::table('cohort_checkouts')->where('cohort_id', $id)->where('user_id', $user->id)->where('status', 'pending')->where('expires_at', '>', now())->first();
            if ($pending) {
                return ['authorization_url' => $pending->authorization_url, 'reference' => $pending->reference];
            }
            abort_unless($this->hasRoom($cohort), 409, 'This cohort is full.');
            if ((float) $cohort->price === 0.0) {
                $this->grant($user, $cohort, 0);

                return ['enrolled' => true, 'message' => 'Cohort joined. Your course is now in My Courses.'];
            }
            abort_unless(config('services.paystack.secret_key'), 503, 'Payments are not configured. Please contact the academy.');
            $reference = 'cohort-'.Str::uuid();
            $response = Http::withToken(config('services.paystack.secret_key'))->timeout(20)->post('https://api.paystack.co/transaction/initialize', [
                'email' => $user->email, 'amount' => (int) round($cohort->price * 100), 'currency' => 'NGN', 'reference' => $reference,
                'callback_url' => route('cohorts.payment-return'),
                'metadata' => json_encode(['cohort_id' => $id, 'user_id' => $user->id]),
            ]);
            abort_unless($response->successful() && $response->json('status') && $response->json('data.authorization_url'), 502, 'Unable to start payment. Please try again.');
            DB::table('cohort_checkouts')->insert(['cohort_id' => $id, 'user_id' => $user->id, 'reference' => $reference, 'amount' => $cohort->price, 'status' => 'pending', 'authorization_url' => $response->json('data.authorization_url'), 'expires_at' => now()->addMinutes(30), 'created_at' => now(), 'updated_at' => now()]);

            return ['authorization_url' => $response->json('data.authorization_url'), 'reference' => $reference];
        });
    }

    public function complete(string $reference, ?User $user = null): array
    {
        $checkout = DB::table('cohort_checkouts')->where('reference', $reference)->first();
        abort_unless($checkout, 404);
        abort_if($user && $checkout->user_id !== $user->id, 403);
        if ($checkout->status === 'completed') {
            return ['enrolled' => true, 'message' => 'Enrollment complete. Your course is in My Courses.'];
        }
        if (in_array($checkout->status, ['refund_pending', 'refund_requested'])) {
            return $this->refund($checkout);
        }
        $response = Http::withToken(config('services.paystack.secret_key'))->timeout(20)->get('https://api.paystack.co/transaction/verify/'.rawurlencode($reference));
        $payer = User::findOrFail($checkout->user_id);
        abort_unless($response->successful() && $response->json('status'), 502, 'Unable to verify payment right now. Please try again.');
        abort_unless($response->json('data.status') === 'success', 422, 'Payment has not been confirmed. You can retry after completing payment.');
        abort_unless($response->json('data.reference') === $reference && $response->json('data.currency') === 'NGN'
            && (int) $response->json('data.amount') === (int) round($checkout->amount * 100)
            && strtolower((string) $response->json('data.customer.email')) === strtolower($payer->email), 422, 'Payment details do not match this enrollment.');
        $result = DB::transaction(function () use ($checkout, $payer) {
            $cohort = DB::table('cohorts')->where('id', $checkout->cohort_id)->lockForUpdate()->first();
            $current = DB::table('cohort_checkouts')->where('id', $checkout->id)->lockForUpdate()->first();
            if ($current->status === 'completed') {
                return ['enrolled' => true, 'message' => 'Enrollment complete.'];
            }
            if ($current->status !== 'pending') {
                return ['refund' => true];
            }
            $joined = DB::table('cohort_students')->where('cohort_id', $cohort->id)->where('user_id', $payer->id)->exists();
            // A payment arriving after its reservation expired must never oversubscribe.
            if ($joined || ! $this->hasRoom($cohort, $checkout->id) || $cohort->status !== 'active' || ($cohort->ends_on && $cohort->ends_on < today()->toDateString())) {
                DB::table('cohort_checkouts')->where('id', $checkout->id)->update(['status' => 'refund_pending', 'updated_at' => now()]);

                return ['refund' => true];
            }
            $this->grant($payer, $cohort, (float) $checkout->amount);
            DB::table('payments')->insert(['user_id' => $payer->id, 'course_id' => $cohort->course_id, 'transaction_id' => $checkout->reference, 'amount' => $checkout->amount, 'payment_status' => 'completed', 'created_at' => now(), 'updated_at' => now()]);
            DB::table('cohort_checkouts')->where('id', $checkout->id)->update(['status' => 'completed', 'updated_at' => now()]);

            return ['enrolled' => true, 'message' => 'Enrollment complete. Your course is in My Courses.'];
        });

        return isset($result['refund']) ? $this->refund($checkout) : $result;
    }

    private function refund(object $checkout): array
    {
        return DB::transaction(function () use ($checkout) {
            $current = DB::table('cohort_checkouts')->where('id', $checkout->id)->lockForUpdate()->first();
            if ($current->status !== 'refund_requested') {
                $response = Http::withToken(config('services.paystack.secret_key'))->timeout(20)->post('https://api.paystack.co/refund', ['transaction' => $checkout->reference]);
                abort_unless($response->successful() && $response->json('status'), 503, 'Your payment was received, but a seat is unavailable. Please contact support with reference '.$checkout->reference.' for your refund.');
                DB::table('cohort_checkouts')->where('id', $checkout->id)->update(['status' => 'refund_requested', 'updated_at' => now()]);
            }

            return ['enrolled' => false, 'message' => 'This cohort filled before your payment was confirmed. A refund has been requested.'];
        });
    }
}
