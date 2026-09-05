<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssignmentSubmission extends Model
{
    protected $fillable = ['assignment_id', 'user_id', 'github_url', 'live_url', 'notes', 'status', 'score', 'mentor_feedback', 'submitted_at', 'reviewed_at'];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function passed(): bool
    {
        return $this->status === 'approved' && $this->score >= $this->assignment->passing_score;
    }
}
