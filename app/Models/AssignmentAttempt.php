<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AssignmentAttempt extends Model {
    protected $fillable=['assignment_id','user_id','score','correct_answers','total_questions','passed'];
    protected function casts():array{return ['passed'=>'boolean'];}
    public function assignment(){return $this->belongsTo(Assignment::class);}
    public function user(){return $this->belongsTo(User::class);}
    public function answers(){return $this->hasMany(AssignmentAnswer::class);}
}
