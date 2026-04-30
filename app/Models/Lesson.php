<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lesson extends Model
{
    protected $fillable = ['course_id', 'title', 'order'];

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class)->orderBy('order', 'asc');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}