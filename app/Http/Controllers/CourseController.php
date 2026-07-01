<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function show(Course $course)
    {
        $user = Auth::user();

        if ($user->role === 'student') {
            $enrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->exists();

            if (!$enrolled) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        $course->load([
            'lessons' => fn($q) => $q->orderBy('order')->orderBy('id'),
            'lessons.topics',
            'user',
            'faculty',
            'exam',
        ]);

        $completedLessonIds = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->pluck('lesson_id')
            ->toArray();

        return Inertia::render('CourseLearning', [
            'course'             => $course,
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
        ]);

        return back()->with('message', 'Course published successfully to the Academy!');
    }
    public function storeLesson(Request $request) 
    {
        $request->validate(['lesson_title' => 'required', 'course_id' => 'required']);
        
        \App\Models\Lesson::create([
            'title' => $request->lesson_title,
            'course_id' => $request->course_id,
        ]);

        return back()->with('message', 'Lesson added to the curriculum!');
    }
    public function storeTopic(Request $request)
    {
        $validated = $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'title'     => 'required|string|max:255',
            'type'      => 'required|in:video,pdf,text',
            'content'   => 'required_if:type,text|nullable|string',
            'video_url' => 'nullable|url',
            'file'      => 'nullable|file|max:102400',
        ]);

        $data = [
            'lesson_id' => $validated['lesson_id'],
            'title'     => $validated['title'],
            'type'      => $validated['type'],
            'video_url' => $validated['video_url'] ?? null,
            'order'     => \App\Models\Topic::where('lesson_id', $validated['lesson_id'])->count() + 1,
        ];

        if ($validated['type'] === 'text') {
            $data['content'] = $validated['content'];
        } 
        elseif ($request->hasFile('file')) {
            $folder = $validated['type'] === 'video' ? 'videos' : 'materials';
            $path = $request->file('file')->store($folder, 'public');
            $data['content'] = $path; 
        }

        $topic = \App\Models\Topic::create($data);

        if ($topic) {
            return back()->with('message', 'Content published successfully!');
        }

        return back()->withErrors(['error' => 'Failed to save to database.']);
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

            $alreadyEnrolled = \App\Models\Enrollment::where([
                'user_id' => Auth::id(),
                'course_id' => $request->course_id,
            ])->exists();

            if ($alreadyEnrolled) {

                return response()->json([
                    'message' => 'Already enrolled'
                ], 422);
            }

            // ENROLLMENT
            \App\Models\Enrollment::create([
                'user_id' => Auth::id(),
                'course_id' => $request->course_id,
                'amount_paid' => $request->amount,
            ]);

            $course = Course::with('user')->findOrFail($request->course_id);

            // Student activity
            \App\Models\Activity::create([
                'user_id' => Auth::id(),
                'type' => 'enrollment',
                'description' => 'Enrolled in "' . $course->title . '"',
            ]);

            // Tutor activity
            if ($course->user) {
                \App\Models\Activity::create([
                    'user_id' => $course->user->id,
                    'type' => 'student_enrollment',
                    'description' => Auth::user()->name . ' enrolled in "' . $course->title . '"',
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
                'message' => 'Enrollment successful'
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}