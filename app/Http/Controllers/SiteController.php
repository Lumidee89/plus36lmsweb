<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Certificate;
use App\Models\LessonCompletion;
use App\Models\Faculty;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SiteController extends Controller
{
    public function index() {
        $totalEnrolled = User::count();

        return Inertia::render('Home', [
            'totalEnrolled' => $totalEnrolled, 
            'featuredCourses' => Course::with(['user', 'lessons'])
                            ->latest()
                            ->take(3) 
                            ->get(),
            'faculties' => Faculty::all(),
        ]);
    }
    public function dashboard() {
        $user = Auth::user();
        $role = $user->role;
        $stats = [];

        // Role-specific collections (default empty)
        $tutorStudents       = collect();
        $tutorCourseBreakdown = collect();
        $myWithdrawals       = collect();
        $availableBalance    = 0;
        $allStudents         = collect();
        $allTutors           = collect();
        $allWithdrawals      = collect();

        // 1. Stats + role-specific data
        if ($role === 'admin') {
            $stats = [
                'total_tutors'      => User::where('role', 'tutor')->count(),
                'total_students'    => User::where('role', 'student')->count(),
                'total_earnings'    => Enrollment::sum('amount_paid'),
                'total_withdrawals' => Withdrawal::where('status', 'completed')->sum('amount'),
            ];

            $allStudents = User::where('role', 'student')
                ->withCount('enrolledCourses')
                ->latest()
                ->get(['id', 'name', 'email', 'created_at']);

            $allTutors = User::where('role', 'tutor')
                ->withCount('courses')
                ->latest()
                ->get(['id', 'name', 'email', 'created_at']);

            $allWithdrawals = Withdrawal::with('user:id,name,email')
                ->latest()
                ->get();

        } elseif ($role === 'tutor') {
            $tutorCourseIds = Course::where('user_id', $user->id)->pluck('id');

            $tutorStudents = Enrollment::with(['user:id,name,email', 'course:id,title'])
                ->whereIn('course_id', $tutorCourseIds)
                ->latest()
                ->get();

            $tutorCourseBreakdown = Course::where('user_id', $user->id)
                ->withCount('enrollments')
                ->withSum('enrollments', 'amount_paid')
                ->get(['id', 'title', 'price']);

            $totalEarned    = $tutorStudents->sum('amount_paid');
            $totalWithdrawn = Withdrawal::where('user_id', $user->id)
                                ->whereIn('status', ['pending', 'completed'])
                                ->sum('amount');
            $availableBalance = $totalEarned - $totalWithdrawn;

            $myWithdrawals = Withdrawal::where('user_id', $user->id)->latest()->get();

            $stats = [
                'total_courses'     => $tutorCourseIds->count(),
                'total_students'    => $tutorStudents->unique('user_id')->count(),
                'total_earnings'    => $totalEarned,
                'total_withdrawals' => Withdrawal::where('user_id', $user->id)->where('status', 'completed')->sum('amount'),
            ];

        } elseif ($role === 'student') {
            $stats = [
                'total_courses' => Enrollment::where('user_id', $user->id)->count(),
            ];
        }

        // 2. Courses & lessons per role
        if ($role === 'admin') {
            $courses = Course::with(['lessons.topics', 'user'])->get();
            $lessons = Lesson::all();
        } elseif ($role === 'tutor') {
            $courses = Course::where('user_id', $user->id)
                ->with(['lessons.topics', 'user', 'faculty', 'exam.questions.options'])
                ->get();

            $lessons = Lesson::whereIn('course_id', function ($q) use ($user) {
                $q->select('id')->from('courses')->where('user_id', $user->id);
            })->get();
        } else {
            $courses = Course::with(['lessons.topics', 'user', 'faculty'])->latest()->get();

            $enrolledCourses = $user->enrolledCourses()
                ->with(['lessons.topics', 'user', 'faculty', 'exam'])
                ->get();

            $completedLessonIds = LessonCompletion::where('user_id', $user->id)
                ->pluck('lesson_id')
                ->toArray();

            $userCertCourseIds = Certificate::where('user_id', $user->id)
                ->pluck('course_id')
                ->toArray();

            $enrolledCourses->each(function ($course) use ($completedLessonIds, $userCertCourseIds) {
                $lessonIds = $course->lessons->pluck('id')->toArray();
                $total     = count($lessonIds);
                $completed = count(array_intersect($lessonIds, $completedLessonIds));
                $course->is_completed = $total > 0 && $completed >= $total;
                $course->progress_pct = $total > 0 ? round($completed / $total * 100) : 0;
                $course->has_exam     = $course->exam !== null;
                $course->cert_issued  = in_array($course->id, $userCertCourseIds);
            });

            $certificates = Certificate::where('user_id', $user->id)
                ->with('course:id,title')
                ->latest()
                ->get();

            $lessons = Lesson::all();
        }

        // 3. Return
        return Inertia::render('Dashboard', [
            'auth'                   => ['user' => $user],
            'user_data'              => [
                'enrolled_track'    => $user->enrolled_track ?? 'None, Enroll Now!',
                'student_id_prefix' => 'P36',
            ],
            'faculties'              => Faculty::all(),
            'courses'                => $courses,
            'enrolledCourses'        => $enrolledCourses ?? [],
            'lessons'                => $lessons,
            'stats'                  => $stats,
            'tutor_students'         => $tutorStudents,
            'tutor_course_breakdown' => $tutorCourseBreakdown,
            'my_withdrawals'         => $myWithdrawals,
            'available_balance'      => $availableBalance,
            'all_students'           => $allStudents,
            'all_tutors'             => $allTutors,
            'all_withdrawals'        => $allWithdrawals,
            'certificates'           => $certificates ?? [],
            'recent_activities'      => $user->activities()->latest()->limit(5)->get(),
        ]);
    }
}