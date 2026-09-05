<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AssignmentAnswer;
use App\Models\AssignmentAttempt;
use App\Models\AssignmentOption;
use App\Models\AssignmentQuestion;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Services\CertificateIssuanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssignmentController extends Controller
{
    public function __construct(private CertificateIssuanceService $certificates) {}

    public function store(Request $request, Lesson $lesson)
    {
        $this->authorizeManagement($request, $lesson);
        $data = $request->validate([
            'title'=>'required|string|max:255', 'type'=>'required|in:objective,project',
            'instructions'=>'required|string', 'maximum_score'=>'required|integer|min:1|max:1000',
            'passing_score'=>'required|integer|min:1|lte:maximum_score', 'rubric'=>'nullable|array',
            'rubric.*'=>'nullable|string|max:255', 'due_at'=>'nullable|date',
        ]);
        $data['rubric'] = array_values(array_filter($data['rubric'] ?? []));
        $assignment = $lesson->assignment()->updateOrCreate([], $data);

        return $request->expectsJson()
            ? response()->json(['message'=>'Assessment saved.','assignment'=>$assignment])
            : back()->with('message', 'Assessment saved. You can now add questions or await project submissions.');
    }

    public function storeQuestion(Request $request, Assignment $assignment)
    {
        $this->authorizeManagement($request, $assignment->lesson);
        abort_unless($assignment->type === 'objective', 422, 'Questions can only be added to objective assessments.');
        $data = $request->validate(['question'=>'required|string|max:2000','options'=>'required|array|min:2|max:6','options.*'=>'required|string|max:500','correct_index'=>'required|integer|min:0']);
        abort_if($data['correct_index'] >= count($data['options']), 422, 'Choose a valid correct answer.');
        $question = DB::transaction(function () use ($assignment, $data) {
            $question = $assignment->questions()->create(['question'=>$data['question'],'position'=>$assignment->questions()->count()+1]);
            foreach ($data['options'] as $index=>$option) $question->options()->create(['option_text'=>$option,'is_correct'=>$index===(int)$data['correct_index']]);
            return $question->load('options');
        });
        return $request->expectsJson() ? response()->json(['message'=>'Question added.','question'=>$question],201) : back()->with('message','Objective question added.');
    }

    public function updateQuestion(Request $request, AssignmentQuestion $question)
    {
        $question->load('assignment.lesson');
        $this->authorizeManagement($request, $question->assignment->lesson);
        $data = $request->validate(['question'=>'required|string|max:2000','options'=>'required|array|min:2|max:6','options.*'=>'required|string|max:500','correct_index'=>'required|integer|min:0']);
        abort_if($data['correct_index'] >= count($data['options']), 422, 'Choose a valid correct answer.');
        DB::transaction(function () use ($question, $data) {
            $question->update(['question'=>$data['question']]);
            $question->options()->delete();
            foreach ($data['options'] as $index=>$option) $question->options()->create(['option_text'=>$option,'is_correct'=>$index===(int)$data['correct_index']]);
        });
        return $request->expectsJson() ? response()->json(['message'=>'Question updated.','question'=>$question->fresh('options')]) : back()->with('message','Objective question updated.');
    }

    public function deleteQuestion(Request $request, AssignmentQuestion $question)
    {
        $this->authorizeManagement($request, $question->assignment->lesson);
        $question->delete();
        return $request->expectsJson() ? response()->json(['message'=>'Question removed.']) : back()->with('message','Question removed.');
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        $this->authorizeManagement($request,$assignment->lesson); $assignment->delete();
        return $request->expectsJson()?response()->json(['message'=>'Assessment deleted.']):back()->with('message','Assessment and its questions/submissions were deleted.');
    }

    public function attempt(Request $request, Assignment $assignment)
    {
        abort_unless($assignment->type === 'objective', 422, 'This assessment requires a project submission.');
        $this->authorizeStudent($request, $assignment);
        abort_if(AssignmentAttempt::where('assignment_id',$assignment->id)->where('user_id',$request->user()->id)->where('passed',true)->exists(), 409, 'You have already passed this assessment. It cannot be taken again.');
        abort_unless(LessonCompletion::where('user_id',$request->user()->id)->where('lesson_id',$assignment->lesson_id)->exists(),403,'Complete the lesson before taking its assessment.');
        $data = $request->validate(['answers'=>'required|array']);
        $assignment->load('questions.options');
        abort_if($assignment->questions->isEmpty(),422,'This assessment has no questions yet.');
        $correct = 0;
        $attempt = DB::transaction(function () use ($assignment,$request,$data,&$correct) {
            $total=$assignment->questions->count();
            foreach($assignment->questions as $question){$correctOption=$question->options->firstWhere('is_correct',true);if($correctOption && (int)($data['answers'][$question->id]??0)===$correctOption->id)$correct++;}
            $score=(int)round(($correct/$total)*$assignment->maximum_score);
            $attempt=AssignmentAttempt::create(['assignment_id'=>$assignment->id,'user_id'=>$request->user()->id,'score'=>$score,'correct_answers'=>$correct,'total_questions'=>$total,'passed'=>$score >= $assignment->passing_score]);
            foreach($assignment->questions as $question){$optionId=(int)($data['answers'][$question->id]??0);$correctOption=$question->options->firstWhere('is_correct',true);AssignmentAnswer::create(['assignment_attempt_id'=>$attempt->id,'assignment_question_id'=>$question->id,'assignment_option_id'=>$optionId?:null,'is_correct'=>$correctOption?->id===$optionId]);}
            return $attempt;
        });
        if ($attempt->passed) $this->certificates->issueIfEligible($request->user(), $assignment->lesson->course);
        return response()->json(['message'=>$attempt->passed?'You passed. The next lesson is now unlocked.':'You did not meet the cutoff. Review the lesson and try again.','attempt'=>$attempt,'score'=>$attempt->score,'maximum_score'=>$assignment->maximum_score,'passing_score'=>$assignment->passing_score,'passed'=>$attempt->passed]);
    }

    public function submit(Request $request, Assignment $assignment)
    {
        abort_unless($assignment->type === 'project',422,'Answer the objective questions instead.');
        $this->authorizeStudent($request,$assignment);
        abort_if(AssignmentSubmission::where('assignment_id',$assignment->id)->where('user_id',$request->user()->id)->where('status','approved')->exists(),409,'You have already passed this assessment. It cannot be submitted again.');
        abort_unless(LessonCompletion::where('user_id',$request->user()->id)->where('lesson_id',$assignment->lesson_id)->exists(),403,'Complete the lesson before submitting.');
        $data=$request->validate(['github_url'=>'nullable|url','live_url'=>'nullable|url','notes'=>'nullable|string|max:5000']);
        abort_if(empty($data['github_url'])&&empty($data['live_url'])&&empty($data['notes']),422,'Add a GitHub link, live link, or submission notes.');
        $submission=$assignment->submissions()->updateOrCreate(['user_id'=>$request->user()->id],[...$data,'status'=>'submitted','submitted_at'=>now(),'score'=>null,'mentor_feedback'=>null,'reviewed_at'=>null]);
        return response()->json(['message'=>'Project sent to your tutor for scoring.','submission'=>$submission]);
    }

    public function review(Request $request, AssignmentSubmission $submission)
    {
        $submission->load('assignment.lesson.course','user'); $this->authorizeManagement($request,$submission->assignment->lesson);
        $data=$request->validate(['score'=>'required|integer|min:0','mentor_feedback'=>'nullable|string|max:5000']);
        abort_if((int)$data['score'] > $submission->assignment->maximum_score,422,'Score cannot exceed the maximum score.');
        $passed=(int)$data['score'] >= $submission->assignment->passing_score;
        $submission->update([...$data,'status'=>$passed?'approved':'changes_requested','reviewed_at'=>now()]);
        if ($passed) $this->certificates->issueIfEligible($submission->user, $submission->assignment->lesson->course);
        return $request->expectsJson()?response()->json(['message'=>'Assessment scored.','submission'=>$submission,'passed'=>$passed]):back()->with('message','Assessment scored and feedback sent.');
    }

    public function results(Request $request)
    {
        $objective=AssignmentAttempt::where('user_id',$request->user()->id)->with('assignment.lesson.course:id,title')->latest()->get()->map(fn($a)=>['id'=>'objective-'.$a->id,'type'=>'objective','title'=>$a->assignment->title,'lesson'=>$a->assignment->lesson->title,'course'=>$a->assignment->lesson->course->title,'score'=>$a->score,'maximum_score'=>$a->assignment->maximum_score,'passing_score'=>$a->assignment->passing_score,'passed'=>$a->passed,'status'=>$a->passed?'passed':'failed','feedback'=>null,'taken_at'=>$a->created_at]);
        $projects=AssignmentSubmission::where('user_id',$request->user()->id)->with('assignment.lesson.course:id,title')->latest()->get()->map(fn($s)=>['id'=>'project-'.$s->id,'type'=>'project','title'=>$s->assignment->title,'lesson'=>$s->assignment->lesson->title,'course'=>$s->assignment->lesson->course->title,'score'=>$s->score,'maximum_score'=>$s->assignment->maximum_score,'passing_score'=>$s->assignment->passing_score,'passed'=>$s->status==='approved','status'=>$s->status,'feedback'=>$s->mentor_feedback,'taken_at'=>$s->submitted_at]);
        return response()->json(['results'=>$objective->concat($projects)->sortByDesc('taken_at')->values()]);
    }

    private function authorizeManagement(Request $request, Lesson $lesson): void { $lesson->loadMissing('course');abort_unless($request->user()->role==='admin'||($request->user()->role==='tutor'&&$lesson->course->user_id===$request->user()->id),403); }
    private function authorizeStudent(Request $request, Assignment $assignment): void { abort_unless($request->user()->role==='student',403);abort_unless(Enrollment::where('user_id',$request->user()->id)->where('course_id',$assignment->lesson->course_id)->exists(),403,'You are not enrolled in this course.'); }
}
