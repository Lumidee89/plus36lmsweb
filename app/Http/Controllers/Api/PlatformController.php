<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LessonCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PlatformController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $organizationId = $request->user()->organization_id;

        return response()->json([
            'organization' => $organizationId ? DB::table('organizations')->find($organizationId) : null,
            'subscription' => $organizationId ? DB::table('subscriptions')->join('subscription_plans', 'subscription_plans.id', '=', 'subscriptions.subscription_plan_id')->where('organization_id', $organizationId)->select('subscriptions.*', 'subscription_plans.name as plan_name', 'subscription_plans.features')->latest('subscriptions.id')->first() : null,
            'cohorts' => DB::table('cohorts')->where('status', '!=', 'deleted')->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))->latest()->get(),
        ]);
    }

    public function createOrganization(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['name' => 'required|string|max:255', 'slug' => 'nullable|string|max:100|unique:organizations,slug']);
        $id = DB::table('organizations')->insertGetId(['name' => $data['name'], 'slug' => $data['slug'] ?? Str::slug($data['name']).'-'.Str::lower(Str::random(5)), 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        $request->user()->update(['organization_id' => $id]);

        return response()->json(['organization' => DB::table('organizations')->find($id)], 201);
    }

    public function plans(): JsonResponse
    {
        return response()->json(['plans' => DB::table('subscription_plans')->orderBy('price')->get()]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' && $request->user()->organization_id, 403);
        $data = $request->validate(['plan_id' => 'required|exists:subscription_plans,id', 'provider_reference' => 'nullable|string|max:255']);
        $plan = DB::table('subscription_plans')->find($data['plan_id']);
        DB::table('subscriptions')->where('organization_id', $request->user()->organization_id)->whereIn('status', ['trialing', 'active'])->update(['status' => 'cancelled', 'updated_at' => now()]);
        $id = DB::table('subscriptions')->insertGetId(['organization_id' => $request->user()->organization_id, 'subscription_plan_id' => $plan->id, 'status' => 'active', 'starts_at' => now(), 'ends_at' => $plan->interval === 'yearly' ? now()->addYear() : now()->addMonth(), 'provider_reference' => $data['provider_reference'] ?? null, 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['subscription' => DB::table('subscriptions')->find($id)], 201);
    }

    public function cohorts(Request $request): JsonResponse
    {
        return response()->json(['cohorts' => app(\App\Services\CohortService::class)->listing($request->user())]);
    }

    public function tutorCohorts(Request $request): JsonResponse
    {
        return response()->json(['cohorts' => app(\App\Services\CohortService::class)->tutorRoster($request->user())]);
    }

    public function createCohort(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'tutor'], true), 403);
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id', 'name' => 'required|string|max:255',
            'starts_on' => 'required|date', 'ends_on' => 'nullable|date|after_or_equal:starts_on',
            'capacity' => 'required|integer|min:1|max:100000', 'price' => 'required|numeric|min:0|max:9999999999.99|decimal:0,2',
        ]);
        $course = Course::findOrFail($data['course_id']);
        abort_if($request->user()->role === 'tutor' && $course->user_id !== $request->user()->id, 403);
        abort_if($request->user()->organization_id && $course->organization_id !== $request->user()->organization_id, 403);
        $id = DB::table('cohorts')->insertGetId([...$data, 'organization_id' => $course->organization_id, 'tutor_id' => $course->user_id, 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['cohort' => DB::table('cohorts')->find($id)], 201);
    }

    private function managedCohort(Request $request, int $id): object
    {
        abort_unless($request->user()->role === 'admin', 403);
        $cohort = DB::table('cohorts')->where('id', $id)->where('status', '!=', 'deleted')->lockForUpdate()->first();
        abort_unless($cohort, 404);
        abort_if($request->user()->organization_id && $cohort->organization_id !== $request->user()->organization_id, 403);
        return $cohort;
    }

    public function updateCohort(Request $request, int $cohort): JsonResponse
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id', 'name' => 'required|string|max:255',
            'starts_on' => 'required|date', 'ends_on' => 'nullable|date|after_or_equal:starts_on',
            'capacity' => 'required|integer|min:1|max:100000', 'price' => 'required|numeric|min:0|max:9999999999.99|decimal:0,2',
            'status' => 'required|in:active,draft,closed',
        ]);
        DB::transaction(function () use ($request, $cohort, $data) {
            $current = $this->managedCohort($request, $cohort);
            $members = DB::table('cohort_students')->where('cohort_id', $cohort)->count();
            $reserved = DB::table('cohort_checkouts')->where('cohort_id', $cohort)->where('status', 'pending')->where('expires_at', '>', now())->count();
            abort_if($data['capacity'] < $members + $reserved, 422, 'Capacity cannot be less than enrolled students plus reserved seats.');
            $course = Course::findOrFail($data['course_id']);
            abort_if($request->user()->organization_id && $course->organization_id !== $request->user()->organization_id, 403);
            if ($course->id !== $current->course_id) {
                abort_if($members > 0 || DB::table('cohort_checkouts')->where('cohort_id', $cohort)->exists(), 422, 'The course cannot be changed after enrollments or payments have started.');
            }
            DB::table('cohorts')->where('id', $cohort)->update([...$data, 'organization_id' => $course->organization_id, 'tutor_id' => $course->user_id, 'updated_at' => now()]);
        });
        return response()->json(['message' => 'Cohort updated.']);
    }

    public function deleteCohort(Request $request, int $cohort): JsonResponse
    {
        DB::transaction(function () use ($request, $cohort) {
            $this->managedCohort($request, $cohort);
            // Retain enrollment and checkout history for course access and payment reconciliation.
            DB::table('cohorts')->where('id', $cohort)->update(['status' => 'deleted', 'updated_at' => now()]);
        });
        return response()->json(['message' => 'Cohort deleted. Existing course access and payment records are retained.']);
    }

    public function joinCohort(Request $request, int $cohort): JsonResponse
    {
        return response()->json(app(\App\Services\CohortService::class)->checkout($request->user(), $cohort));
    }

    public function verifyCohort(Request $request, int $cohort): JsonResponse
    {
        $data = $request->validate(['reference' => 'required|string|max:100']);
        abort_unless(DB::table('cohort_checkouts')->where('cohort_id', $cohort)->where('reference', $data['reference'])->exists(), 404);
        return response()->json(app(\App\Services\CohortService::class)->complete($data['reference'], $request->user()));
    }

    public function createDepartment(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' && $request->user()->organization_id, 403);
        $data = $request->validate(['name' => 'required|string|max:255', 'code' => 'required|string|max:30']);
        $id = DB::table('departments')->insertGetId([...$data, 'organization_id' => $request->user()->organization_id, 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['department' => DB::table('departments')->find($id)], 201);
    }

    public function createAcademicSession(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' && $request->user()->organization_id, 403);
        $data = $request->validate(['name' => 'required|string|max:100', 'starts_on' => 'required|date', 'ends_on' => 'required|date|after:starts_on', 'is_current' => 'boolean']);
        if ($data['is_current'] ?? false) {
            DB::table('academic_sessions')->where('organization_id', $request->user()->organization_id)->update(['is_current' => false]);
        }
        $id = DB::table('academic_sessions')->insertGetId([...$data, 'organization_id' => $request->user()->organization_id, 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['academic_session' => DB::table('academic_sessions')->find($id)], 201);
    }

    public function registerDevice(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => 'required|string|max:500', 'platform' => 'nullable|in:ios,android,web']);
        DB::table('device_tokens')->updateOrInsert(['token' => $data['token']], ['user_id' => $request->user()->id, 'platform' => $data['platform'] ?? null, 'last_seen_at' => now(), 'updated_at' => now(), 'created_at' => now()]);

        return response()->json(['message' => 'Notification device registered.']);
    }

    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate(['operations' => 'array|max:100', 'operations.*.client_id' => 'required|uuid', 'operations.*.type' => 'required|in:lesson_completion', 'operations.*.entity_id' => 'required|integer']);
        foreach ($data['operations'] ?? [] as $operation) {
            $new = DB::table('offline_sync_records')->insertOrIgnore(['user_id' => $request->user()->id, 'client_id' => $operation['client_id'], 'entity_type' => $operation['type'], 'entity_id' => $operation['entity_id'], 'action' => 'upsert', 'payload' => json_encode($operation), 'status' => 'processed', 'created_at' => now(), 'updated_at' => now()]);
            if ($new) {
                LessonCompletion::firstOrCreate(['user_id' => $request->user()->id, 'lesson_id' => $operation['entity_id']], ['completed_at' => now()]);
            }
        }

        return response()->json(['processed' => count($data['operations'] ?? []), 'server_time' => now()->toIso8601String()]);
    }

    public function askAi(Request $request): JsonResponse
    {
        $data = $request->validate(['question' => 'required|string|max:2000', 'course_id' => 'nullable|exists:courses,id']);
        abort_unless(config('services.openai.key'), 503, 'AI assistance is not configured.');
        $context = $data['course_id'] ? Course::with('lessons.topics')->find($data['course_id'])->lessons->flatMap->topics->pluck('content')->filter()->implode("\n") : '';
        $response = Http::withToken(config('services.openai.key'))->timeout(30)->post('https://api.openai.com/v1/responses', ['model' => config('services.openai.model'), 'instructions' => 'You are the Plus36 Academy study assistant. Teach clearly, give hints before answers, and only use the supplied course context when it is provided.', 'input' => "Course context:\n".Str::limit(strip_tags($context), 12000)."\n\nStudent question: ".$data['question']]);
        $response->throw();
        $answer = $response->json('output.0.content.0.text') ?? 'I could not produce an answer.';
        DB::table('ai_conversations')->insert(['user_id' => $request->user()->id, 'course_id' => $data['course_id'] ?? null, 'title' => Str::limit($data['question'], 80), 'messages' => json_encode([['role' => 'user', 'content' => $data['question']], ['role' => 'assistant', 'content' => $answer]]), 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['answer' => $answer]);
    }
}
