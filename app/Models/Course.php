<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'faculty_id',
        'title',
        'description',
        'price',
        'duration',
    ];
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function students()
    {
        return $this->belongsToMany(User::class, 'enrollments')->withPivot('amount_paid')->withTimestamps();
    }
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function exam()
    {
        return $this->hasOne(Exam::class);
    }
}