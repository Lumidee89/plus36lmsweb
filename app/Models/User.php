<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'google_id',
        'google_avatar',
        'avatar',
    ];

    protected $appends = ['avatar_url'];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return Storage::disk('uploads')->url($this->avatar);
        }
        if ($this->google_avatar) {
            return $this->google_avatar;
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=0d9488&color=fff&size=128';
    }
    public function courses()
    {
        return $this->hasMany(Course::class);
    }
    public function activities() {
        return $this->hasMany(Activity::class)->latest()->limit(5);
    }
    public function enrolledCourses()
    {
        return $this->belongsToMany(
            Course::class,
            'enrollments'
        )->withPivot('amount_paid')
        ->withTimestamps();
    }

    public function streak()
    {
        return $this->hasOne(UserStreak::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(UserActivityLog::class);
    }

    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot('earned_at')
            ->withTimestamps();
    }

    public function lessonCompletions()
    {
        return $this->hasMany(LessonCompletion::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}
