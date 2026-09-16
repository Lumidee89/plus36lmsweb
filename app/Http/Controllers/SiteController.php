<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\AssignmentSubmission;
use App\Models\AssignmentAttempt;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function index()
    {
        $totalEnrolled = User::count();

        return Inertia::render('Home', [
            'totalEnrolled' => $totalEnrolled,
            'cohorts' => app(\App\Services\CohortService::class)->listing(Auth::user()),
            'featuredCourses' => Course::with(['user', 'lessons'])
                ->latest()
                ->take(3)
                ->get(),
            'faculties' => Faculty::all(),
        ]);
    }

    public function dashboard()
    {
        $user = Auth::user();
        $role = $user->role;
        app(\App\Services\CohortService::class)->restoreCourseAccess($user);
        $stats = [];

        // Role-specific collections (default empty)
        $tutorStudents = collect();
        $tutorCourseBreakdown = collect();
        $myWithdrawals = collect();
        $availableBalance = 0;
        $allStudents = collect();
        $allTutors = collect();
        $allWithdrawals = collect();
        $platform = [];
        $assessmentSubmissions = collect();
        $objectiveAttempts = collect();

        // 1. Stats + role-specific data
        if ($role === 'admin') {
            $stats = [
                'total_tutors' => User::where('role', 'tutor')->count(),
                'total_students' => User::where('role', 'student')->count(),
                'total_earnings' => Enrollment::sum('amount_paid'),
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
            $platform = [
                'organization' => $user->organization_id ? DB::table('organizations')->find($user->organization_id) : null,
                'plans' => DB::table('subscription_plans')->orderBy('price')->get(),
                'subscription' => $user->organization_id ? DB::table('subscriptions')->where('organization_id', $user->organization_id)->latest()->first() : null,
                'cohorts' => app(\App\Services\CohortService::class)->listing($user),
                'departments' => $user->organization_id ? DB::table('departments')->where('organization_id', $user->organization_id)->get() : [],
                'academic_sessions' => $user->organization_id ? DB::table('academic_sessions')->where('organization_id', $user->organization_id)->latest()->get() : [],
                'banners' => DB::table('mobile_banners')->latest()->get(),
            ];

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

            $totalEarned = $tutorStudents->sum('amount_paid');
            $totalWithdrawn = Withdrawal::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'completed'])
                ->sum('amount');
            $availableBalance = $totalEarned - $totalWithdrawn;

            $myWithdrawals = Withdrawal::where('user_id', $user->id)->latest()->get();
            $assessmentSubmissions = AssignmentSubmission::whereHas('assignment.lesson.course', fn ($query) => $query->where('user_id', $user->id))
                ->with(['user:id,name,email', 'assignment.lesson.course:id,title'])
                ->latest('submitted_at')->get();
            $objectiveAttempts = AssignmentAttempt::whereHas('assignment.lesson.course', fn ($query) => $query->where('user_id', $user->id))
                ->with(['user:id,name,email', 'assignment.lesson.course:id,title'])
                ->latest()->get();

            $stats = [
                'total_courses' => $tutorCourseIds->count(),
                'total_students' => $tutorStudents->unique('user_id')->count(),
                'total_earnings' => $totalEarned,
                'total_withdrawals' => Withdrawal::where('user_id', $user->id)->where('status', 'completed')->sum('amount'),
            ];

        } elseif ($role === 'student') {
            $stats = [
                'total_courses' => Enrollment::where('user_id', $user->id)->count(),
                'available_courses' => Course::count(),
                'total_certificates' => Certificate::where('user_id', $user->id)->count(),
                'completed_courses' => 0,
            ];
        }

        // 2. Courses & lessons per role
        if ($role === 'admin') {
            $courses = Course::with(['weeks.modules.lessons.topics', 'weeks.modules.lessons.assignment.questions.options', 'lessons.topics', 'lessons.assignment.questions.options', 'user'])->get();
            $lessons = Lesson::all();
        } elseif ($role === 'tutor') {
            $courses = Course::where('user_id', $user->id)
                ->with(['weeks.modules.lessons.topics', 'weeks.modules.lessons.assignment.questions.options', 'lessons.topics', 'lessons.assignment.questions.options', 'user', 'faculty', 'exam.questions.options'])
                ->get();

            $lessons = Lesson::whereIn('course_id', function ($q) use ($user) {
                $q->select('id')->from('courses')->where('user_id', $user->id);
            })->get();
        } else {
            $courses = Course::where('status', 'published')->with(['lessons.topics', 'user', 'faculty'])->latest()->get();

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
                $total = count($lessonIds);
                $completed = count(array_intersect($lessonIds, $completedLessonIds));
                $course->is_completed = $total > 0 && $completed >= $total;
                $course->progress_pct = $total > 0 ? round($completed / $total * 100) : 0;
                $course->has_exam = $course->exam !== null;
                $course->cert_issued = in_array($course->id, $userCertCourseIds);
            });

            $stats['completed_courses'] = $enrolledCourses->where('is_completed', true)->count();

            $certificates = Certificate::where('user_id', $user->id)
                ->with('course:id,title')
                ->latest()
                ->get();

            $lessons = Lesson::all();
        }

        // 3. Return
        return Inertia::render('Dashboard', [
            'auth' => ['user' => $user],
            'user_data' => [
                'enrolled_track' => $user->enrolled_track ?? 'None, Enroll Now!',
                'student_id_prefix' => 'P36',
            ],
            'faculties' => Faculty::all(),
            'courses' => $courses,
            'enrolledCourses' => $enrolledCourses ?? [],
            'lessons' => $lessons,
            'stats' => $stats,
            'tutor_students' => $tutorStudents,
            'tutor_cohorts' => $role === 'tutor' ? app(\App\Services\CohortService::class)->tutorRoster($user) : [],
            'tutor_course_breakdown' => $tutorCourseBreakdown,
            'my_withdrawals' => $myWithdrawals,
            'available_balance' => $availableBalance,
            'all_students' => $allStudents,
            'all_tutors' => $allTutors,
            'all_withdrawals' => $allWithdrawals,
            'certificates' => $certificates ?? [],
            'recent_activities' => $user->activities()->latest()->limit(5)->get(),
            'platform' => $platform,
            'cohorts' => app(\App\Services\CohortService::class)->listing($user),
            'assessment_submissions' => $assessmentSubmissions,
            'objective_attempts' => $objectiveAttempts,
        ]);
    }
}
