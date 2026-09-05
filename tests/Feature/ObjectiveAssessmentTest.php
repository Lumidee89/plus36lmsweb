<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Services\LessonAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ObjectiveAssessmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_objective_assessment_is_scored_and_unlocks_next_lesson(): void
    {
        $tutor=User::factory()->create(['role'=>'tutor']); $student=User::factory()->create(['role'=>'student']);
        $faculty=Faculty::create(['name'=>'Technology']);
        $course=Course::create(['user_id'=>$tutor->id,'faculty_id'=>$faculty->id,'title'=>'Test course','description'=>'Test','price'=>0,'duration'=>'1 week','status'=>'published']);
        $lesson=Lesson::create(['course_id'=>$course->id,'title'=>'One','order'=>1]);
        $next=Lesson::create(['course_id'=>$course->id,'title'=>'Two','order'=>2]);
        Enrollment::create(['user_id'=>$student->id,'course_id'=>$course->id,'amount_paid'=>0]);
        LessonCompletion::create(['user_id'=>$student->id,'lesson_id'=>$lesson->id,'completed_at'=>now()]);
        $assignment=Assignment::create(['lesson_id'=>$lesson->id,'title'=>'Quiz','type'=>'objective','instructions'=>'Answer','maximum_score'=>100,'passing_score'=>70]);
        foreach(['First?','Second?'] as $text){$question=$assignment->questions()->create(['question'=>$text,'position'=>$assignment->questions()->count()+1]);$question->options()->create(['option_text'=>'Correct','is_correct'=>true]);$question->options()->create(['option_text'=>'Wrong','is_correct'=>false]);}
        $answers=$assignment->load('questions.options')->questions->mapWithKeys(fn($q)=>[$q->id=>$q->options->firstWhere('is_correct',true)->id])->all();
        Sanctum::actingAs($student);
        $this->postJson("/api/assignments/{$assignment->id}/attempt",['answers'=>$answers])->assertOk()->assertJson(['score'=>100,'passed'=>true]);
        $this->postJson("/api/assignments/{$assignment->id}/attempt",['answers'=>$answers])->assertStatus(409)->assertJsonPath('message','You have already passed this assessment. It cannot be taken again.');
        $this->assertDatabaseCount('assignment_attempts',1);
        $this->assertTrue(app(LessonAccessService::class)->canStart($student,$next->setRelation('course',$course)));
        $this->getJson('/api/assessment-results')->assertOk()->assertJsonPath('results.0.score',100);
    }
}
