<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamAttempt;
use App\Models\ExamOption;
use App\Models\ExamQuestion;
use App\Models\LessonCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    // -------------------------------------------------------------------------
    // TUTOR: create an exam for a course
    // POST /api/exams
    // -------------------------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tutor'], true)) {
            abort(403, 'Only tutors can create exams.');
        }

        $validated = $request->validate([
            'course_id'    => 'required|exists:courses,id',
            'title'        => 'required|string|max:255',
            'passing_score' => 'nullable|integer|min:1|max:100',
        ]);

        $course = Course::findOrFail($validated['course_id']);
        if ($request->user()->role === 'tutor' && $course->user_id !== $request->user()->id) {
            abort(403, 'You do not own this course.');
        }

        $exam = Exam::firstOrCreate(
            ['course_id' => $validated['course_id']],
            [
                'title'         => $validated['title'],
                'passing_score' => $validated['passing_score'] ?? 70,
            ]
        );

        return response()->json([
            'message' => $exam->wasRecentlyCreated ? 'Exam created.' : 'Exam already exists.',
            'exam'    => $this->formatExam($exam->load('questions.options'), reveal: true),
        ], $exam->wasRecentlyCreated ? 201 : 200);
    }

    // -------------------------------------------------------------------------
    // TUTOR: get exam for a course with correct-answer visibility
    // GET /api/courses/{course}/exam/manage
    // -------------------------------------------------------------------------
    public function manage(Request $request, Course $course): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tutor'], true)) {
            abort(403);
        }

        if ($request->user()->role === 'tutor' && $course->user_id !== $request->user()->id) {
            abort(403, 'You do not own this course.');
        }

        $exam = Exam::with('questions.options')->where('course_id', $course->id)->first();

        if (! $exam) {
            return response()->json(['exam' => null]);
        }

        return response()->json([
            'exam' => $this->formatExam($exam, reveal: true),
        ]);
    }

    // -------------------------------------------------------------------------
    // TUTOR: add a question to an exam
    // POST /api/exam-questions
    // -------------------------------------------------------------------------
    public function storeQuestion(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tutor'], true)) {
            abort(403, 'Only tutors can add questions.');
        }

        $validated = $request->validate([
            'exam_id'       => 'required|exists:exams,id',
            'question'      => 'required|string',
            'options'       => 'required|array|min:2|max:4',
            'options.*'     => 'required|string|max:500',
            'correct_index' => 'required|integer|min:0',
        ]);

        $exam = Exam::with('course')->findOrFail($validated['exam_id']);

        if ($request->user()->role === 'tutor' && $exam->course->user_id !== $request->user()->id) {
            abort(403, 'You do not own this course.');
        }

        $question = ExamQuestion::create([
            'exam_id'  => $exam->id,
            'question' => $validated['question'],
            'order'    => ExamQuestion::where('exam_id', $exam->id)->count() + 1,
        ]);

        foreach ($validated['options'] as $idx => $text) {
            ExamOption::create([
                'question_id' => $question->id,
                'option_text' => $text,
                'is_correct'  => $idx === (int) $validated['correct_index'],
            ]);
        }

        return response()->json([
            'message'  => 'Question added.',
            'question' => $this->formatQuestion($question->load('options'), reveal: true),
        ], 201);
    }

    // -------------------------------------------------------------------------
    // TUTOR: delete a question
    // DELETE /api/exam-questions/{question}
    // -------------------------------------------------------------------------
    public function deleteQuestion(Request $request, ExamQuestion $question): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tutor'], true)) {
            abort(403);
        }

        $exam = Exam::with('course')->findOrFail($question->exam_id);

        if ($request->user()->role === 'tutor' && $exam->course->user_id !== $request->user()->id) {
            abort(403, 'You do not own this course.');
        }

        $question->delete();

        return response()->json(['message' => 'Question removed.']);
    }

    // -------------------------------------------------------------------------
    // STUDENT: view exam for a course (is_correct stripped)
    // GET /api/courses/{course}/exam
    // -------------------------------------------------------------------------
    public function show(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'student') {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)->exists();
            if (! $enrolled) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        $exam = Exam::with('questions.options')->where('course_id', $course->id)->first();

        if (! $exam) {
            return response()->json(['message' => 'No exam set for this course yet.'], 404);
        }

        $course->load('lessons');
        $lessonIds    = $course->lessons->pluck('id')->toArray();
        $completedIds = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->toArray();
        $allLessonsCompleted = count($lessonIds) > 0 && count($completedIds) >= count($lessonIds);

        $bestAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->orderByDesc('score')->first();

        $certificate = Certificate::where('user_id', $user->id)
            ->where('course_id', $course->id)->first();

        return response()->json([
            'exam'                  => $this->formatExam($exam, reveal: false),
            'all_lessons_completed' => $allLessonsCompleted,
            'best_attempt'          => $bestAttempt ? [
                'id'    => $bestAttempt->id,
                'score' => $bestAttempt->score,
                'passed' => $bestAttempt->passed,
                'created_at' => $bestAttempt->created_at,
            ] : null,
            'certificate'           => $certificate ? $this->formatCertificate($certificate) : null,
        ]);
    }

    // -------------------------------------------------------------------------
    // STUDENT: submit an attempt
    // POST /api/exams/{exam}/attempt
    // -------------------------------------------------------------------------
    public function submitAttempt(Request $request, Exam $exam): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'student') {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $exam->course_id)->exists();
            if (! $enrolled) abort(403, 'You are not enrolled in this course.');
        }

        $request->validate(['answers' => 'required|array']);

        $exam->load('questions.options', 'course.lessons');
        $questions = $exam->questions;
        $total     = $questions->count();

        if ($total === 0) {
            return response()->json(['message' => 'This exam has no questions.'], 422);
        }

        $answers = $request->input('answers', []);
        $correct = 0;

        foreach ($questions as $question) {
            $selectedId    = $answers[$question->id] ?? null;
            $correctOption = $question->options->firstWhere('is_correct', true);
            if ($selectedId && $correctOption && $correctOption->id == $selectedId) {
                $correct++;
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

        $certificate = null;

        if ($passed) {
            $lessonIds    = $exam->course->lessons->pluck('id')->toArray();
            $completedIds = LessonCompletion::where('user_id', $user->id)
                ->whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->toArray();
            $allCompleted = count($lessonIds) > 0 && count($completedIds) >= count($lessonIds);

            if ($allCompleted) {
                $existing = Certificate::where('user_id', $user->id)
                    ->where('course_id', $exam->course_id)->first();

                if (! $existing) {
                    $existing = Certificate::create([
                        'user_id'            => $user->id,
                        'course_id'          => $exam->course_id,
                        'certificate_number' => 'CERT-' . date('Y') . '-' . strtoupper(substr(md5(uniqid('', true)), 0, 8)),
                        'issued_at'          => now(),
                        'exam_score'         => $score,
                    ]);
                }

                $certificate = $this->formatCertificate($existing);
            }
        }

        $message = $passed
            ? "Congratulations! You scored {$score}%. Your certificate of completion has been issued!"
            : "You scored {$score}%. The passing score is {$exam->passing_score}%. Review the material and try again.";

        return response()->json([
            'message'     => $message,
            'score'       => $score,
            'passed'      => $passed,
            'attempt_id'  => $attempt->id,
            'certificate' => $certificate,
        ]);
    }

    // -------------------------------------------------------------------------
    // STUDENT/TUTOR: list certificates for the authenticated user
    // GET /api/certificates
    // -------------------------------------------------------------------------
    public function certificates(Request $request): JsonResponse
    {
        $certs = Certificate::where('user_id', $request->user()->id)
            ->with('course:id,title')
            ->latest()
            ->get()
            ->map(fn ($c) => $this->formatCertificate($c));

        return response()->json(['certificates' => $certs]);
    }

    // -------------------------------------------------------------------------
    // STUDENT/TUTOR: view a single certificate
    // GET /api/certificates/{certificate}
    // -------------------------------------------------------------------------
    public function showCertificate(Request $request, Certificate $certificate): JsonResponse
    {
        if ($certificate->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            abort(403, 'Access denied.');
        }

        $certificate->load(['user:id,name,email', 'course:id,title,user_id', 'course.user:id,name']);

        return response()->json(['certificate' => $this->formatCertificate($certificate, full: true)]);
    }

    // -------------------------------------------------------------------------
    // Formatters
    // -------------------------------------------------------------------------
    private function formatExam(Exam $exam, bool $reveal = false): array
    {
        return [
            'id'            => $exam->id,
            'course_id'     => $exam->course_id,
            'title'         => $exam->title,
            'passing_score' => $exam->passing_score,
            'questions'     => $exam->questions->map(fn ($q) => $this->formatQuestion($q, $reveal))->values(),
        ];
    }

    private function formatQuestion(ExamQuestion $question, bool $reveal = false): array
    {
        return [
            'id'       => $question->id,
            'question' => $question->question,
            'order'    => $question->order,
            'options'  => $question->options->map(function ($o) use ($reveal) {
                $data = [
                    'id'          => $o->id,
                    'option_text' => $o->option_text,
                ];
                if ($reveal) {
                    $data['is_correct'] = (bool) $o->is_correct;
                }
                return $data;
            })->values(),
        ];
    }

    private function formatCertificate(Certificate $certificate, bool $full = false): array
    {
        $data = [
            'id'                 => $certificate->id,
            'certificate_number' => $certificate->certificate_number,
            'exam_score'         => $certificate->exam_score,
            'issued_at'          => $certificate->issued_at,
            'course'             => $certificate->course ? [
                'id'    => $certificate->course->id,
                'title' => $certificate->course->title,
            ] : null,
        ];

        if ($full) {
            $data['student'] = $certificate->user ? [
                'id'    => $certificate->user->id,
                'name'  => $certificate->user->name,
                'email' => $certificate->user->email,
            ] : null;
            $data['tutor'] = $certificate->course?->user ? [
                'id'   => $certificate->course->user->id,
                'name' => $certificate->course->user->name,
            ] : null;
        }

        return $data;
    }
}
