<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $fillable = ['course_id', 'course_module_id', 'title', 'order', 'estimated_minutes', 'is_preview'];

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class)->orderBy('order', 'asc');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'course_module_id');
    }

    public function completions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    public function assignment()
    {
        return $this->hasOne(Assignment::class);
    }
}
