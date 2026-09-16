<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Assignment;
use App\Models\AssignmentAttempt;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseWeek;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Topic;
use App\Services\LessonAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    public function __construct(private LessonAccessService $lessonAccess) {}

    public function index(Request $request): JsonResponse
    {
        $courses = Course::where('status', 'published')
            ->where(fn ($query) => $query->whereNull('organization_id')->orWhere('organization_id', $request->user()->organization_id))
            ->with(['faculty', 'user', 'weeks.modules.lessons.assignment.questions.options', 'weeks.modules.lessons.topics', 'lessons.assignment.questions.options', 'lessons.topics'])
            ->latest()
            ->paginate($request->integer('per_page', 15));

        $courses->getCollection()->transform(fn (Course $course) => $this->formatCourse($course, $request));

        return response()->json($courses);
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        return response()->json([
            'course' => $this->formatCourse($course->load(['faculty', 'user', 'weeks.modules.lessons.assignment.questions.options', 'weeks.modules.lessons.topics', 'lessons.assignment.questions.options', 'lessons.topics']), $request),
            'is_enrolled' => Enrollment::where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->exists(),
        ]);
    }

    public function enrolled(Request $request): JsonResponse
    {
        app(\App\Services\CohortService::class)->restoreCourseAccess($request->user());
        $memberships = DB::table('cohort_students as cs')->join('cohorts as c', 'c.id', '=', 'cs.cohort_id')
            ->where('cs.user_id', $request->user()->id)
            ->select('c.id', 'c.course_id', 'c.name', 'c.starts_on', 'c.ends_on', 'c.status')
            ->orderBy('c.starts_on')->get()->groupBy('course_id');
        $courses = $request->user()
            ->enrolledCourses()
            ->with(['faculty', 'user', 'weeks.modules.lessons.assignment.questions.options', 'weeks.modules.lessons.topics', 'lessons.assignment.questions.options', 'lessons.topics'])
            ->latest('enrollments.created_at')
            ->get()
            ->map(fn (Course $course) => [...$this->formatCourse($course, $request),
                'enrolled_cohorts' => $memberships->get($course->id, collect())->values(),
            ]);

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
            'organization_id' => $request->user()->organization_id,
            'status' => $request->user()->role === 'admin' ? 'published' : 'draft',
            'published_at' => $request->user()->role === 'admin' ? now() : null,
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

    public function storeWeek(Request $request, Course $course): JsonResponse
    {
        $this->ensureCanManageCourse($request, $course);
        $validated = $request->validate(['title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string', 'max:1000']]);
        $week = $course->weeks()->create([...$validated, 'position' => $course->weeks()->count() + 1]);

        return response()->json(['message' => 'Week added successfully', 'week' => $week], 201);
    }

    public function storeModule(Request $request, CourseWeek $week): JsonResponse
    {
        $week->load('course');
        $this->ensureCanManageCourse($request, $week->course);
        $validated = $request->validate(['title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string', 'max:1000']]);
        $module = $week->modules()->create([...$validated, 'position' => $week->modules()->count() + 1]);

        return response()->json(['message' => 'Module added successfully', 'module' => $module], 201);
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
            $data['content'] = $request->file('file')->store($folder, 'uploads');
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
            'status' => $course->status,
            'faculty' => $course->faculty,
            'tutor' => $course->user,
            'lessons' => $course->lessons->map(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'order' => $lesson->order,
                'locked' => $request->user()?->role === 'student' ? ! $this->lessonAccess->canStart($request->user(), $lesson->setRelation('course', $course)) : false,
                'completed' => $request->user()?->role === 'student' ? LessonCompletion::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->exists() : false,
                'assignment' => $this->formatAssignment($lesson->assignment, $request),
                'topics' => $lesson->topics->map(fn (Topic $topic) => $this->formatTopic($topic))->values(),
            ])->values(),
            'weeks' => $course->weeks->map(fn ($week) => [
                'id' => $week->id,
                'title' => $week->title,
                'description' => $week->description,
                'position' => $week->position,
                'modules' => $week->modules->map(fn ($module) => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'position' => $module->position,
                    'lessons' => $module->lessons->map(fn (Lesson $lesson) => [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'order' => $lesson->order,
                        'estimated_minutes' => $lesson->estimated_minutes,
                        'is_preview' => $lesson->is_preview,
                        'locked' => $request->user()?->role === 'student' ? ! $this->lessonAccess->canStart($request->user(), $lesson->setRelation('course', $course)) : false,
                        'completed' => $request->user()?->role === 'student' ? LessonCompletion::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->exists() : false,
                        'assignment' => $this->formatAssignment($lesson->assignment, $request),
                        'topics' => $lesson->topics->map(fn (Topic $topic) => $this->formatTopic($topic))->values(),
                    ])->values(),
                ])->values(),
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
            $contentUrl = Storage::disk('uploads')->url($topic->content);
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

    private function formatAssignment(?Assignment $assignment, Request $request): ?array
    {
        if (! $assignment) return null;
        $reveal = in_array($request->user()?->role, ['admin', 'tutor'], true);
        $result = null;
        if ($request->user()?->role === 'student') {
            $result = $assignment->type === 'objective'
                ? AssignmentAttempt::where('assignment_id',$assignment->id)->where('user_id',$request->user()->id)->orderByDesc('passed')->latest()->first()
                : AssignmentSubmission::where('assignment_id',$assignment->id)->where('user_id',$request->user()->id)->first();
        }
        return [
            'id'=>$assignment->id, 'type'=>$assignment->type, 'title'=>$assignment->title,
            'instructions'=>$assignment->instructions, 'maximum_score'=>$assignment->maximum_score,
            'passing_score'=>$assignment->passing_score, 'rubric'=>$assignment->rubric ?? [], 'due_at'=>$assignment->due_at,
            'questions'=>$assignment->questions->map(fn($question)=>[
                'id'=>$question->id, 'question'=>$question->question, 'position'=>$question->position,
                'options'=>$question->options->map(function($option) use($reveal){$data=['id'=>$option->id,'option_text'=>$option->option_text];if($reveal)$data['is_correct']=$option->is_correct;return $data;})->values(),
            ])->values(),
            'result'=>$result ? ['score'=>$result->score,'passed'=>$assignment->type==='objective'?(bool)$result->passed:$result->status==='approved','status'=>$assignment->type==='objective'?($result->passed?'passed':'failed'):$result->status,'feedback'=>$result->mentor_feedback ?? null] : null,
        ];
    }
}
