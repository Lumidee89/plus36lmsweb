<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\LessonCompletion;
use App\Models\UserActivityLog;
use App\Services\AchievementService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProgressController extends Controller
{
    public function __construct(private AchievementService $achievements) {}

    public function show(Request $request)
    {
        $user = Auth::user()->load(['streak', 'achievements', 'enrolledCourses.lessons']);

        $streak = $user->streak;

        $totalMinutes = $user->activityLogs()->sum('minutes_spent');
        $totalHours = round($totalMinutes / 60, 1);

        $completedLessons = LessonCompletion::where('user_id', $user->id)->count();

        $certificates = $this->countCertificates($user);

        $weekData = $this->getWeekActivity($user->id);

        $allAchievements = Achievement::all()->map(function ($achievement) use ($user) {
            $earned = $user->achievements->firstWhere('id', $achievement->id);
            return [
                'key' => $achievement->key,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'icon' => $achievement->icon,
                'color' => $achievement->color,
                'earned' => (bool) $earned,
                'earned_at' => $earned?->pivot->earned_at,
            ];
        });

        return Inertia::render('Progress', [
            'streak' => [
                'current' => $streak?->current_streak ?? 0,
                'longest' => $streak?->longest_streak ?? 0,
            ],
            'stats' => [
                'hours' => $totalHours,
                'lessons' => $completedLessons,
                'certificates' => $certificates,
            ],
            'thisWeek' => $weekData,
            'achievements' => $allAchievements,
        ]);
    }

    public function ping(Request $request)
    {
        $minutes = max(1, min(30, (int) $request->input('minutes', 5)));
        UserActivityLog::addMinutes(Auth::id(), $minutes);

        return back();
    }

    public function completeLesson(Request $request, int $lessonId)
    {
        LessonCompletion::firstOrCreate(
            ['user_id' => Auth::id(), 'lesson_id' => $lessonId],
            ['completed_at' => Carbon::now()]
        );

        $this->achievements->checkAndAward(Auth::user()->load(['streak', 'activityLogs', 'enrolledCourses.lessons']));

        return back();
    }

    private function countCertificates($user): int
    {
        return $user->enrolledCourses->filter(function ($course) use ($user) {
            $totalLessons = $course->lessons->count();
            if ($totalLessons === 0) return false;

            $completedLessons = LessonCompletion::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->count();

            return $completedLessons >= $totalLessons;
        })->count();
    }

    private function getWeekActivity(int $userId): array
    {
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        $logs = UserActivityLog::where('user_id', $userId)
            ->whereBetween('date', [$startOfWeek, $startOfWeek->copy()->endOfWeek()])
            ->get()
            ->keyBy(fn($log) => $log->date->toDateString());

        $weekDays = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $log = $logs->get($date->toDateString());
            $weekDays[] = [
                'label' => $days[$i],
                'date' => $date->toDateString(),
                'minutes' => $log?->minutes_spent ?? 0,
            ];
        }

        $totalMinutes = collect($weekDays)->sum('minutes');

        return [
            'total_hours' => round($totalMinutes / 60, 1),
            'days' => $weekDays,
        ];
    }
}
