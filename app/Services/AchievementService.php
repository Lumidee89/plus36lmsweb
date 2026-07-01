<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\User;
use Carbon\Carbon;

class AchievementService
{
    public function checkAndAward(User $user): void
    {
        $this->checkFastStart($user);
        $this->checkStreakAchievements($user);
        $this->checkDedicatedLearner($user);
        $this->checkCourseGraduate($user);
    }

    private function award(User $user, string $key): void
    {
        $achievement = Achievement::where('key', $key)->first();

        if (!$achievement) {
            return;
        }

        $user->achievements()->syncWithoutDetaching([
            $achievement->id => ['earned_at' => Carbon::now()],
        ]);
    }

    private function checkFastStart(User $user): void
    {
        if ($user->enrolledCourses()->count() >= 1) {
            $this->award($user, 'fast_start');
        }
    }

    private function checkStreakAchievements(User $user): void
    {
        $streak = $user->streak?->current_streak ?? 0;

        if ($streak >= 3) {
            $this->award($user, 'streak_3');
        }

        if ($streak >= 7) {
            $this->award($user, 'on_fire');
        }

        if ($streak >= 30) {
            $this->award($user, 'streak_warrior');
        }
    }

    private function checkDedicatedLearner(User $user): void
    {
        $totalMinutes = $user->activityLogs()->sum('minutes_spent');

        if ($totalMinutes >= 3000) { // 50 hours
            $this->award($user, 'dedicated_learner');
        }
    }

    private function checkCourseGraduate(User $user): void
    {
        $completedCount = $user->enrolledCourses()
            ->whereHas('lessons', function ($q) use ($user) {
                $q->whereHas('completions', function ($q2) use ($user) {
                    $q2->where('user_id', $user->id);
                });
            })
            ->get()
            ->filter(function ($course) use ($user) {
                $totalLessons = $course->lessons()->count();
                if ($totalLessons === 0) {
                    return false;
                }
                $completedLessons = $course->lessons()
                    ->whereHas('completions', fn($q) => $q->where('user_id', $user->id))
                    ->count();
                return $completedLessons >= $totalLessons;
            })
            ->count();

        if ($completedCount >= 1) {
            $this->award($user, 'course_graduate');
        }
    }
}
