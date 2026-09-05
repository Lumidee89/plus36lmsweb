<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentAttempt;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Faculty;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Services\CertificateIssuanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateIssuanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_certificate_is_issued_once_after_all_course_requirements_are_passed(): void
    {
        $tutor=User::factory()->create(['role'=>'tutor']);
        $student=User::factory()->create(['role'=>'student']);
        $faculty=Faculty::create(['name'=>'Technology']);
        $course=Course::create(['user_id'=>$tutor->id,'faculty_id'=>$faculty->id,'title'=>'Complete course','description'=>'Test','price'=>0,'duration'=>'1 week','status'=>'published']);
        $quizLesson=Lesson::create(['course_id'=>$course->id,'title'=>'Quiz lesson','order'=>1]);
        $projectLesson=Lesson::create(['course_id'=>$course->id,'title'=>'Project lesson','order'=>2]);
        LessonCompletion::create(['user_id'=>$student->id,'lesson_id'=>$quizLesson->id,'completed_at'=>now()]);
        LessonCompletion::create(['user_id'=>$student->id,'lesson_id'=>$projectLesson->id,'completed_at'=>now()]);

        $quiz=Assignment::create(['lesson_id'=>$quizLesson->id,'title'=>'Quiz','type'=>'objective','instructions'=>'Answer','maximum_score'=>100,'passing_score'=>70]);
        AssignmentAttempt::create(['assignment_id'=>$quiz->id,'user_id'=>$student->id,'score'=>90,'correct_answers'=>9,'total_questions'=>10,'passed'=>true]);
        $project=Assignment::create(['lesson_id'=>$projectLesson->id,'title'=>'Project','type'=>'project','instructions'=>'Build','maximum_score'=>100,'passing_score'=>70]);
        AssignmentSubmission::create(['assignment_id'=>$project->id,'user_id'=>$student->id,'status'=>'approved','score'=>85,'submitted_at'=>now(),'reviewed_at'=>now()]);
        $exam=Exam::create(['course_id'=>$course->id,'title'=>'Final exam','passing_score'=>70]);
        ExamAttempt::create(['exam_id'=>$exam->id,'user_id'=>$student->id,'score'=>92,'passed'=>true]);

        $service=app(CertificateIssuanceService::class);
        $certificate=$service->issueIfEligible($student,$course);
        $sameCertificate=$service->issueIfEligible($student,$course);

        $this->assertNotNull($certificate);
        $this->assertSame($certificate->id,$sameCertificate->id);
        $this->assertSame(92,$certificate->exam_score);
        $this->assertDatabaseCount('certificates',1);
        $this->assertDatabaseHas('activities',['user_id'=>$student->id,'type'=>'achievement']);
    }
}
