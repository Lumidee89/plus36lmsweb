<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamAttempt;
use App\Models\ExamOption;
use App\Models\ExamQuestion;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExamController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title'     => 'required|string|max:255',
        ]);

        $course = Course::findOrFail($request->course_id);
        if ($course->user_id !== Auth::id()) abort(403);

        Exam::firstOrCreate(
            ['course_id' => $request->course_id],
            ['title' => $request->title, 'passing_score' => 70]
        );

        return back()->with('message', 'Exam created! Now add some questions.');
    }

    public function storeQuestion(Request $request)
    {
        $request->validate([
            'exam_id'       => 'required|exists:exams,id',
            'question'      => 'required|string',
            'options'       => 'required|array|min:2|max:4',
            'options.*'     => 'required|string|max:500',
            'correct_index' => 'required|integer|min:0',
        ]);

        $exam = Exam::with('course')->findOrFail($request->exam_id);
        if ($exam->course->user_id !== Auth::id()) abort(403);

        $question = ExamQuestion::create([
            'exam_id'  => $exam->id,
            'question' => $request->question,
            'order'    => ExamQuestion::where('exam_id', $exam->id)->count() + 1,
        ]);

        foreach ($request->options as $idx => $text) {
            ExamOption::create([
                'question_id' => $question->id,
                'option_text' => $text,
                'is_correct'  => $idx === (int) $request->correct_index,
            ]);
        }

        return back()->with('message', 'Question added!');
    }

    public function deleteQuestion(ExamQuestion $question)
    {
        $exam = Exam::with('course')->findOrFail($question->exam_id);
        if ($exam->course->user_id !== Auth::id()) abort(403);

        $question->delete();
        return back()->with('message', 'Question removed.');
    }

    public function show(Course $course)
    {
        $user = Auth::user();

        if ($user->role === 'student') {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)->exists();
            if (!$enrolled) abort(403, 'You are not enrolled in this course.');
        }

        $exam = Exam::with('questions.options')->where('course_id', $course->id)->first();
        if (!$exam) abort(404, 'No exam set for this course yet.');

        $course->load('lessons');
        $lessonIds = $course->lessons->pluck('id')->toArray();
        $completedIds = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->toArray();
        $allLessonsCompleted = count($lessonIds) > 0 && count($completedIds) >= count($lessonIds);

        $bestAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->orderByDesc('score')->first();

        $certificate = Certificate::where('user_id', $user->id)
            ->where('course_id', $course->id)->first();

        // Strip correct-answer flags before sending to student
        $examData = $exam->toArray();
        foreach ($examData['questions'] as &$q) {
            foreach ($q['options'] as &$o) {
                unset($o['is_correct']);
            }
        }
        unset($q, $o);

        return Inertia::render('ExamPage', [
            'course'               => $course,
            'exam'                 => $examData,
            'allLessonsCompleted'  => $allLessonsCompleted,
            'bestAttempt'          => $bestAttempt,
            'certificate'          => $certificate,
        ]);
    }

    public function submitAttempt(Request $request, Exam $exam)
    {
        $user = Auth::user();

        if ($user->role === 'student') {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $exam->course_id)->exists();
            if (!$enrolled) abort(403);
        }

        $request->validate(['answers' => 'required|array']);

        $exam->load('questions.options', 'course.lessons');
        $questions = $exam->questions;
        $total = $questions->count();

        if ($total === 0) {
            return back()->withErrors(['error' => 'This exam has no questions.']);
        }

        $answers = $request->input('answers', []);
        $correct = 0;

        foreach ($questions as $question) {
            $selectedId = $answers[$question->id] ?? null;
            if ($selectedId) {
                $correctOption = $question->options->firstWhere('is_correct', true);
                if ($correctOption && $correctOption->id == $selectedId) {
                    $correct++;
                }
            }
        }

        $score  = round($correct / $total * 100);
        $passed = $score >= $exam->passing_score;

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'score'   => $score,
            'passed'  => $passed,
        ]);

        foreach ($questions as $question) {
            $selectedId = $answers[$question->id] ?? null;
            if ($selectedId) {
                ExamAnswer::create([
                    'attempt_id'  => $attempt->id,
                    'question_id' => $question->id,
                    'option_id'   => $selectedId,
                ]);
            }
        }

        if ($passed) {
            $lessonIds = $exam->course->lessons->pluck('id')->toArray();
            $completedIds = LessonCompletion::where('user_id', $user->id)
                ->whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->toArray();
            $allCompleted = count($lessonIds) > 0 && count($completedIds) >= count($lessonIds);

            if ($allCompleted) {
                $exists = Certificate::where('user_id', $user->id)
                    ->where('course_id', $exam->course_id)->exists();

                if (!$exists) {
                    Certificate::create([
                        'user_id'            => $user->id,
                        'course_id'          => $exam->course_id,
                        'certificate_number' => 'CERT-' . date('Y') . '-' . strtoupper(substr(md5(uniqid('', true)), 0, 8)),
                        'issued_at'          => now(),
                        'exam_score'         => $score,
                    ]);
                }
            }
        }

        $message = $passed
            ? "Congratulations! You scored {$score}%. Your certificate of completion has been issued!"
            : "You scored {$score}%. The passing score is {$exam->passing_score}%. Review the material and try again.";

        return redirect()->route('courses.exam', $exam->course_id)->with('message', $message);
    }
}
