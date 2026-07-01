<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            [
                'key'         => 'fast_start',
                'name'        => 'Fast Start',
                'description' => 'Enrolled in your first course',
                'icon'        => 'star',
                'color'       => 'yellow',
            ],
            [
                'key'         => 'streak_3',
                'name'        => 'Getting Warm',
                'description' => '3-day login streak',
                'icon'        => 'flame',
                'color'       => 'orange',
            ],
            [
                'key'         => 'on_fire',
                'name'        => 'On Fire',
                'description' => '7-day login streak',
                'icon'        => 'fire',
                'color'       => 'red',
            ],
            [
                'key'         => 'streak_warrior',
                'name'        => 'Streak Warrior',
                'description' => '30-day login streak',
                'icon'        => 'trophy',
                'color'       => 'purple',
            ],
            [
                'key'         => 'dedicated_learner',
                'name'        => 'Dedicated Learner',
                'description' => 'Logged 50 hours of learning',
                'icon'        => 'clock',
                'color'       => 'blue',
            ],
            [
                'key'         => 'course_graduate',
                'name'        => 'Graduate',
                'description' => 'Completed your first course',
                'icon'        => 'graduation',
                'color'       => 'green',
            ],
            [
                'key'         => 'quiz_ace',
                'name'        => 'Quiz Ace',
                'description' => 'Scored 90%+ on a quiz',
                'icon'        => 'check',
                'color'       => 'teal',
            ],
            [
                'key'         => 'night_owl',
                'name'        => 'Night Owl',
                'description' => 'Studied after midnight',
                'icon'        => 'moon',
                'color'       => 'indigo',
            ],
        ];

        foreach ($achievements as $data) {
            Achievement::updateOrCreate(['key' => $data['key']], $data);
        }
    }
}
