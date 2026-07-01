<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $courses = Course::with(['faculty', 'user', 'lessons.topics'])
            ->latest()
            ->paginate($request->integer('per_page', 15));

        $courses->getCollection()->transform(fn (Course $course) => $this->formatCourse($course, $request));

        return response()->json($courses);
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        return response()->json([
            'course' => $this->formatCourse($course->load(['faculty', 'user', 'lessons.topics']), $request),
            'is_enrolled' => Enrollment::where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->exists(),
        ]);
    }

    public function enrolled(Request $request): JsonResponse
    {
        $courses = $request->user()
            ->enrolledCourses()
            ->with(['faculty', 'user', 'lessons.topics'])
            ->latest('enrollments.created_at')
            ->get()
            ->map(fn (Course $course) => $this->formatCourse($course, $request));

        return response()->json([
            'courses' => $courses,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tutor'], true)) {
            abort(403, 'Only tutors and admins can create courses.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'faculty_id' => ['required', 'exists:faculties,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'duration' => ['required', 'string', 'max:255'],
        ]);

        $course = Course::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Course published successfully',
            'course' => $this->formatCourse($course->load(['faculty', 'user', 'lessons.topics']), $request),
        ], 201);
    }

    public function storeLesson(Request $request, Course $course): JsonResponse
    {
        $this->ensureCanManageCourse($request, $course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'order' => $validated['order'] ?? $course->lessons()->count() + 1,
        ]);

        return response()->json([
            'message' => 'Lesson added successfully',
            'lesson' => $lesson->load('topics'),
        ], 201);
    }

    public function storeTopic(Request $request, Lesson $lesson): JsonResponse
    {
        $lesson->load('course');
        $this->ensureCanManageCourse($request, $lesson->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:video,pdf,text'],
            'content' => ['required_if:type,text', 'nullable', 'string'],
            'video_url' => ['nullable', 'url'],
            'file' => ['nullable', 'file', 'max:102400'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data = [
            'lesson_id' => $lesson->id,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'video_url' => $validated['video_url'] ?? null,
            'order' => $validated['order'] ?? Topic::where('lesson_id', $lesson->id)->count() + 1,
        ];

        if ($validated['type'] === 'text') {
            $data['content'] = $validated['content'];
        } elseif ($request->hasFile('file')) {
            $folder = $validated['type'] === 'video' ? 'videos' : 'materials';
            $data['content'] = $request->file('file')->store($folder, 'public');
        }

        $topic = Topic::create($data);

        return response()->json([
            'message' => 'Topic added successfully',
            'topic' => $this->formatTopic($topic),
        ], 201);
    }

    public function enroll(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'reference' => ['required', 'string', 'max:255'],
        ]);

        if ($request->user()->role !== 'student') {
            abort(403, 'Only students can enroll in courses.');
        }

        if (Enrollment::where('user_id', $request->user()->id)->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages([
                'course_id' => ['Already enrolled in this course.'],
            ]);
        }

        DB::transaction(function () use ($request, $course, $validated): void {
            Enrollment::create([
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'amount_paid' => $validated['amount'],
            ]);

            Activity::create([
                'user_id' => $request->user()->id,
                'type' => 'enrollment',
                'description' => 'Enrolled in "'.$course->title.'"',
            ]);

            if ($course->user) {
                Activity::create([
                    'user_id' => $course->user->id,
                    'type' => 'student_enrollment',
                    'description' => $request->user()->name.' enrolled in "'.$course->title.'"',
                ]);
            }

            DB::table('payments')->insert([
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'transaction_id' => $validated['reference'],
                'amount' => $validated['amount'],
                'payment_status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Enrollment successful',
            'course' => $this->formatCourse($course->load(['faculty', 'user', 'lessons.topics']), $request),
        ]);
    }

    private function ensureCanManageCourse(Request $request, Course $course): void
    {
        if ($request->user()->role === 'admin') {
            return;
        }

        if ($request->user()->role === 'tutor' && $course->user_id === $request->user()->id) {
            return;
        }

        abort(403, 'You are not allowed to manage this course.');
    }

    private function formatCourse(Course $course, Request $request): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'price' => $course->price,
            'duration' => $course->duration,
            'faculty' => $course->faculty,
            'tutor' => $course->user,
            'lessons' => $course->lessons->map(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'order' => $lesson->order,
                'topics' => $lesson->topics->map(fn (Topic $topic) => $this->formatTopic($topic))->values(),
            ])->values(),
            'is_enrolled' => $request->user()
                ? Enrollment::where('user_id', $request->user()->id)->where('course_id', $course->id)->exists()
                : false,
            'created_at' => $course->created_at,
            'updated_at' => $course->updated_at,
        ];
    }

    private function formatTopic(Topic $topic): array
    {
        $contentUrl = null;

        if ($topic->content && in_array($topic->type, ['video', 'pdf'], true)) {
            $contentUrl = Storage::disk('public')->url($topic->content);
        }

        return [
            'id' => $topic->id,
            'lesson_id' => $topic->lesson_id,
            'title' => $topic->title,
            'type' => $topic->type,
            'content' => $topic->content,
            'content_url' => $contentUrl,
            'video_url' => $topic->video_url,
            'order' => $topic->order,
            'created_at' => $topic->created_at,
            'updated_at' => $topic->updated_at,
        ];
    }
}
