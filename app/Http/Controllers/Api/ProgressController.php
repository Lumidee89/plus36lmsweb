<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\LessonCompletion;
use App\Models\UserActivityLog;
use App\Services\AchievementService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function __construct(private AchievementService $achievements) {}

    public function show(Request $request)
    {
        $user = $request->user()->load(['streak', 'achievements', 'enrolledCourses.lessons']);

        $streak = $user->streak;
        $totalMinutes = $user->activityLogs()->sum('minutes_spent');
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

        return response()->json([
            'streak' => [
                'current' => $streak?->current_streak ?? 0,
                'longest' => $streak?->longest_streak ?? 0,
            ],
            'stats' => [
                'hours' => round($totalMinutes / 60, 1),
                'lessons' => $completedLessons,
                'certificates' => $certificates,
            ],
            'this_week' => $weekData,
            'achievements' => $allAchievements,
        ]);
    }

    public function ping(Request $request)
    {
        $request->validate([
            'minutes' => 'integer|min:1|max:30',
        ]);

        $minutes = $request->input('minutes', 5);
        UserActivityLog::addMinutes($request->user()->id, $minutes);

        return response()->json(['message' => 'Activity recorded']);
    }

    public function completeLesson(Request $request, int $lessonId)
    {
        $user = $request->user();

        LessonCompletion::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lessonId],
            ['completed_at' => Carbon::now()]
        );

        $this->achievements->checkAndAward(
            $user->load(['streak', 'activityLogs', 'enrolledCourses.lessons'])
        );

        $completedLessons = LessonCompletion::where('user_id', $user->id)->count();

        return response()->json([
            'message' => 'Lesson completed',
            'total_lessons_completed' => $completedLessons,
        ]);
    }

    private function countCertificates($user): int
    {
        return $user->enrolledCourses->filter(function ($course) use ($user) {
            $totalLessons = $course->lessons->count();
            if ($totalLessons === 0) return false;

            $completed = LessonCompletion::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->count();

            return $completed >= $totalLessons;
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
