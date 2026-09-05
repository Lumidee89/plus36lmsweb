<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    protected $fillable = ['lesson_id', 'title', 'type', 'instructions', 'maximum_score', 'passing_score', 'rubric', 'due_at'];

    protected function casts(): array
    {
        return ['rubric' => 'array', 'due_at' => 'datetime'];
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function questions(){return $this->hasMany(AssignmentQuestion::class)->orderBy('position');}
    public function attempts(){return $this->hasMany(AssignmentAttempt::class);}
}
