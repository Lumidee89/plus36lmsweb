<?php

namespace App\Http\Middleware;

use App\Models\UserStreak;
use App\Services\AchievementService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TrackUserActivity
{
    public function __construct(private AchievementService $achievements) {}

    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (Auth::check()) {
            $user = Auth::user();

            $streak = UserStreak::firstOrCreate(
                ['user_id' => $user->id],
                ['current_streak' => 0, 'longest_streak' => 0]
            );

            $streak->recordActivity();

            $this->achievements->checkAndAward($user);
        }

        return $response;
    }
}
