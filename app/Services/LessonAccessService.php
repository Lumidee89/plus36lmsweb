<?php

namespace App\Services;

use App\Models\AssignmentSubmission;
use App\Models\AssignmentAttempt;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;

class LessonAccessService
{
    public function canStart(User $user, Lesson $lesson): bool
    {
        $previous = $lesson->course->lessons()->where('order', '<', $lesson->order)->orderByDesc('order')->first();
        if (! $previous) {
            return true;
        }
        if (! LessonCompletion::whereBelongsTo($user)->whereBelongsTo($previous)->exists()) {
            return false;
        }
        $assignment = $previous->assignment;
        if (! $assignment) {
            return true;
        }

        if ($assignment->type === 'objective') {
            return AssignmentAttempt::where('assignment_id', $assignment->id)
                ->where('user_id', $user->id)->where('passed', true)->exists();
        }

        return AssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('user_id', $user->id)->where('status', 'approved')
            ->where('score', '>=', $assignment->passing_score)->exists();
    }

    public function assertCanStart(User $user, Lesson $lesson): void
    {
        abort_unless($this->canStart($user, $lesson), 403, 'Complete the previous lesson and pass its assignment before continuing.');
    }
}
