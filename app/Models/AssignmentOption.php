<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AssignmentOption extends Model {
    protected $fillable=['assignment_question_id','option_text','is_correct'];
    protected function casts():array{return ['is_correct'=>'boolean'];}
    public function question(){return $this->belongsTo(AssignmentQuestion::class,'assignment_question_id');}
}
