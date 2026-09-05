<?php

namespace App\Services;

use App\Models\AssignmentAttempt;
use App\Models\AssignmentSubmission;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\ExamAttempt;
use App\Models\LessonCompletion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CertificateIssuanceService
{
    public function issueIfEligible(User $student, Course $course): ?Certificate
    {
        $existing = Certificate::whereBelongsTo($student)->whereBelongsTo($course)->first();
        if ($existing) return $existing;

        $course->loadMissing('lessons.assignment');
        $lessonIds = $course->lessons->pluck('id');
        if ($lessonIds->isEmpty()) return null;

        $completed = LessonCompletion::where('user_id', $student->id)
            ->whereIn('lesson_id', $lessonIds)->distinct('lesson_id')->count('lesson_id');
        if ($completed !== $lessonIds->count()) return null;

        foreach ($course->lessons->pluck('assignment')->filter() as $assignment) {
            $passed = $assignment->type === 'objective'
                ? AssignmentAttempt::whereBelongsTo($assignment)->whereBelongsTo($student)->where('passed', true)->exists()
                : AssignmentSubmission::whereBelongsTo($assignment)->whereBelongsTo($student)->where('status', 'approved')->exists();
            if (! $passed) return null;
        }

        $examAttempt = ExamAttempt::where('user_id', $student->id)
            ->where('passed', true)
            ->whereHas('exam', fn ($query) => $query->where('course_id', $course->id))
            ->latest()->first();
        if (! $examAttempt) return null;

        return DB::transaction(function () use ($student, $course, $examAttempt) {
            $certificate = Certificate::firstOrCreate(
                ['user_id'=>$student->id, 'course_id'=>$course->id],
                ['certificate_number'=>'CERT-'.now()->year.'-'.strtoupper(Str::random(10)), 'issued_at'=>now(), 'exam_score'=>$examAttempt->score],
            );
            if ($certificate->wasRecentlyCreated) {
                $student->activities()->create(['type'=>'achievement', 'description'=>'Earned a certificate for “'.$course->title.'”']);
            }
            return $certificate;
        });
    }
}
