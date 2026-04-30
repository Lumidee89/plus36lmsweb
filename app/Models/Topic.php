<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Topic extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'title',
        'type',
        'content',
        'video_url',
        'order'
    ];

    /**
     * Get the lesson that owns the topic.
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}