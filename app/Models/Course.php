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

    /**
     * Get the tutor (user) that owns the course.
     */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the faculty department this course belongs to.
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
    public function lessons()
    {
        // A Course has many Lessons
        return $this->hasMany(Lesson::class);
    }
    public function user() {
        return $this->belongsTo(User::class);
    }
}