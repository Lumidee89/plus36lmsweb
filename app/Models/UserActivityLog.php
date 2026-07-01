<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class UserActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'minutes_spent',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function addMinutes(int $userId, int $minutes): void
    {
        static::updateOrCreate(
            ['user_id' => $userId, 'date' => Carbon::today()->toDateString()],
            ['minutes_spent' => 0]
        )->increment('minutes_spent', $minutes);
    }
}
