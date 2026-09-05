<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\CourseWeek;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Topic;
use App\Services\LessonAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function __construct(private LessonAccessService $lessonAccess) {}

    public function show(Course $course)
    {
        $user = Auth::user();

        if ($user->role === 'tutor' && $course->user_id !== $user->id) {
            abort(403, 'You can only access courses assigned to you.');
        }

        if ($user->role === 'student') {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->exists();

            if (! $enrolled) {
                return redirect()->route('dashboard')
                    ->with('error', 'You need to enroll in this course before you can access it.');
            }
        }

        $course->load([
            'lessons' => fn ($q) => $q->orderBy('order')->orderBy('id'),
            'lessons.topics',
            'user',
            'faculty',
            'exam',
        ]);

        $completedLessonIds = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->pluck('lesson_id')
            ->toArray();

        if ($user->role === 'student') {
            $course->lessons->each(fn (Lesson $lesson) => $lesson->setAttribute('locked', ! $this->lessonAccess->canStart($user, $lesson->setRelation('course', $course))));
        }

        return Inertia::render('CourseLearning', [
            'course' => $course,
            'completedLessonIds' => $completedLessonIds,
        ]);
    }

    /**
     * Store a newly created course in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'faculty_id' => 'required|exists:faculties,id',
            'price' => 'required|numeric',
            'duration' => 'required|string',
        ]);

        Course::create([
            ...$validated,
            'user_id' => Auth::id(),
            'organization_id' => Auth::user()->organization_id,
            'status' => Auth::user()->role === 'admin' ? 'published' : 'draft',
            'published_at' => Auth::user()->role === 'admin' ? now() : null,
        ]);

        return back()->with('message', Auth::user()->role === 'admin'
            ? 'Course published successfully.'
            : 'Course draft created. Build the curriculum, then submit it for admin publishing.');
    }

    public function publish(Course $course)
    {
        $course->update(['status' => 'published', 'published_at' => now()]);

        return back()->with('message', 'Course is now published.');
    }

    public function storeLesson(Request $request)
    {
        $validated = $request->validate([
            'lesson_title' => 'required|string|max:255',
            'course_id' => 'required|exists:courses,id',
            'course_module_id' => 'nullable|exists:course_modules,id',
            'estimated_minutes' => 'nullable|integer|min:1|max:600',
            'is_preview' => 'nullable|boolean',
        ]);
        $course = Course::findOrFail($validated['course_id']);
        $this->authorizeCourseManagement($course);

        if (! empty($validated['course_module_id'])) {
            $module = CourseModule::with('week')->findOrFail($validated['course_module_id']);
            abort_unless($module->week->course_id === $course->id, 422, 'The module does not belong to this course.');
        }

        $course->lessons()->create([
            'title' => $validated['lesson_title'],
            'course_module_id' => $validated['course_module_id'] ?? null,
            'estimated_minutes' => $validated['estimated_minutes'] ?? 10,
            'is_preview' => $validated['is_preview'] ?? false,
            'order' => $course->lessons()->count() + 1,
        ]);

        return back()->with('message', 'Lesson added to the curriculum!');
    }

    public function storeWeek(Request $request, Course $course)
    {
        $this->authorizeCourseManagement($course);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $course->weeks()->create([
            ...$validated,
            'position' => $course->weeks()->count() + 1,
        ]);

        return back()->with('message', 'Course week added successfully.');
    }

    public function storeModule(Request $request, CourseWeek $week)
    {
        $week->load('course');
        $this->authorizeCourseManagement($week->course);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $week->modules()->create([
            ...$validated,
            'position' => $week->modules()->count() + 1,
        ]);

        return back()->with('message', 'Module added successfully.');
    }

    public function updateWeek(Request $request, CourseWeek $week)
    {
        $week->load('course'); $this->authorizeCourseManagement($week->course);
        $week->update($request->validate(['title'=>'required|string|max:255','description'=>'nullable|string|max:1000']));
        return back()->with('message','Week updated.');
    }

    public function destroyWeek(CourseWeek $week)
    {
        $week->load(['course','modules.lessons.topics']); $this->authorizeCourseManagement($week->course);
        $week->modules->each(fn ($module) => $module->lessons->each(fn ($lesson) => $lesson->topics->each(fn ($topic) => $this->deleteTopicFile($topic))));
        $week->delete();
        return back()->with('message','Week and its modules, lessons, materials and assessments were deleted.');
    }

    public function updateModule(Request $request, CourseModule $module)
    {
        $module->load('week.course'); $this->authorizeCourseManagement($module->week->course);
        $module->update($request->validate(['title'=>'required|string|max:255','description'=>'nullable|string|max:1000']));
        return back()->with('message','Module updated.');
    }

    public function destroyModule(CourseModule $module)
    {
        $module->load(['week.course','lessons.topics']); $this->authorizeCourseManagement($module->week->course);
        $module->lessons->each(fn ($lesson) => $lesson->topics->each(fn ($topic) => $this->deleteTopicFile($topic)));
        $module->delete();
        return back()->with('message','Module and its lessons were deleted.');
    }

    public function updateLesson(Request $request, Lesson $lesson)
    {
        $lesson->load('course'); $this->authorizeCourseManagement($lesson->course);
        $lesson->update($request->validate(['title'=>'required|string|max:255','estimated_minutes'=>'nullable|integer|min:1|max:600','is_preview'=>'nullable|boolean']));
        return back()->with('message','Lesson updated.');
    }

    public function destroyLesson(Lesson $lesson)
    {
        $lesson->load(['course','topics']); $this->authorizeCourseManagement($lesson->course);
        foreach($lesson->topics as $topic) $this->deleteTopicFile($topic); $lesson->delete();
        return back()->with('message','Lesson, materials and assessment deleted.');
    }

    public function storeTopic(Request $request)
    {
        $validated = $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'title' => 'required|string|max:255',
            'type' => 'required|in:video,pdf,text',
            'content' => 'required_if:type,text|nullable|string',
            'video_url' => 'nullable|url',
            'file' => 'nullable|file|max:102400',
        ]);

        $lesson = Lesson::with('course')->findOrFail($validated['lesson_id']);
        $this->authorizeCourseManagement($lesson->course);

        $data = [
            'lesson_id' => $validated['lesson_id'],
            'title' => $validated['title'],
            'type' => $validated['type'],
            'video_url' => $validated['video_url'] ?? null,
            'order' => Topic::where('lesson_id', $validated['lesson_id'])->count() + 1,
        ];

        if ($validated['type'] === 'text') {
            $data['content'] = $this->sanitizeRichText($validated['content']);
        } elseif ($request->hasFile('file')) {
            $folder = $validated['type'] === 'video' ? 'videos' : 'materials';
            $path = $request->file('file')->store($folder, 'uploads');
            $data['content'] = $path;
        }

        $topic = Topic::create($data);

        if ($topic) {
            return back()->with('message', 'Content published successfully!');
        }

        return back()->withErrors(['error' => 'Failed to save to database.']);
    }

    public function updateTopic(Request $request, Topic $topic)
    {
        $topic->load('lesson.course'); $this->authorizeCourseManagement($topic->lesson->course);
        $validated=$request->validate(['title'=>'required|string|max:255','content'=>'nullable|string','video_url'=>'nullable|url','file'=>'nullable|file|max:102400']);
        $data=['title'=>$validated['title'],'video_url'=>$validated['video_url']??null];
        if($topic->type==='text') $data['content']=$this->sanitizeRichText($validated['content']??'');
        elseif($request->hasFile('file')){$this->deleteTopicFile($topic);$data['content']=$request->file('file')->store($topic->type==='video'?'videos':'materials','uploads');}
        $topic->update($data); return back()->with('message','Material updated.');
    }

    public function destroyTopic(Topic $topic)
    {
        $topic->load('lesson.course'); $this->authorizeCourseManagement($topic->lesson->course); $this->deleteTopicFile($topic); $topic->delete();
        return back()->with('message','Material deleted.');
    }

    public function enroll(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'amount' => 'required|numeric',
            'reference' => 'required|string',
        ]);

        DB::beginTransaction();

        try {

            $alreadyEnrolled = Enrollment::where([
                'user_id' => Auth::id(),
                'course_id' => $request->course_id,
            ])->exists();

            if ($alreadyEnrolled) {

                return response()->json([
                    'message' => 'Already enrolled',
                ], 422);
            }

            // ENROLLMENT
            Enrollment::create([
                'user_id' => Auth::id(),
                'course_id' => $request->course_id,
                'amount_paid' => $request->amount,
            ]);

            $course = Course::with('user')->findOrFail($request->course_id);

            // Student activity
            Activity::create([
                'user_id' => Auth::id(),
                'type' => 'enrollment',
                'description' => 'Enrolled in "'.$course->title.'"',
            ]);

            // Tutor activity
            if ($course->user) {
                Activity::create([
                    'user_id' => $course->user->id,
                    'type' => 'student_enrollment',
                    'description' => Auth::user()->name.' enrolled in "'.$course->title.'"',
                ]);
            }

            // PAYMENT
            DB::table('payments')->insert([
                'user_id' => Auth::id(),
                'course_id' => $request->course_id,
                'transaction_id' => $request->reference,
                'amount' => $request->amount,
                'payment_status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment successful',
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function authorizeCourseManagement(Course $course): void
    {
        $user = Auth::user();

        abort_unless(
            $user->role === 'admin' || ($user->role === 'tutor' && $course->user_id === $user->id),
            403,
            'You do not have permission to manage this course.'
        );
    }

    private function sanitizeRichText(string $html): string
    {
        $html = strip_tags($html, '<p><br><strong><b><em><i><u><h2><h3><ul><ol><li><blockquote><pre><code>');

        return preg_replace('/<([a-z0-9]+)[^>]*>/i', '<$1>', $html) ?? '';
    }

    private function deleteTopicFile(Topic $topic): void
    {
        if(in_array($topic->type,['video','pdf'],true)&&$topic->content) Storage::disk('uploads')->delete($topic->content);
    }
}
