<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class UserStreak extends Model
{
    protected $fillable = [
        'user_id',
        'current_streak',
        'longest_streak',
        'last_active_date',
    ];

    protected $casts = [
        'last_active_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recordActivity(): void
    {
        $today = Carbon::today();

        if ($this->last_active_date && $this->last_active_date->eq($today)) {
            return;
        }

        if ($this->last_active_date && $this->last_active_date->eq($today->copy()->subDay())) {
            $this->current_streak += 1;
        } else {
            $this->current_streak = 1;
        }

        if ($this->current_streak > $this->longest_streak) {
            $this->longest_streak = $this->current_streak;
        }

        $this->last_active_date = $today;
        $this->save();
    }
}
