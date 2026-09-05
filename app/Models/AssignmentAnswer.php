<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AssignmentAnswer extends Model {
    protected $fillable=['assignment_attempt_id','assignment_question_id','assignment_option_id','is_correct'];
    protected function casts():array{return ['is_correct'=>'boolean'];}
    public function attempt(){return $this->belongsTo(AssignmentAttempt::class,'assignment_attempt_id');}
}
