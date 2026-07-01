<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = ['course_id', 'title', 'passing_score'];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function questions()
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('order')->orderBy('id');
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }
}
