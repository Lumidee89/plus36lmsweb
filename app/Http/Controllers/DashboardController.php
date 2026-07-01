<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Course;
use App\Models\User;
use App\Models\Faculty;
use App\Models\Enrollment;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // ALL COURSES
        $courses = Course::with([
            'user:id,name',
            'faculty:id,name',
            'lessons'
        ])->latest()->get();

        // ENROLLED COURSES
        $enrolledCourses = Course::whereHas('enrollments', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with([
            'user',
            'faculty',
            'lessons'
        ])->get();

        // TUTOR-SPECIFIC DATA
        $tutorStudents = collect();
        $tutorCourseBreakdown = collect();

        // STATS (role-aware)
        if ($user->role === 'tutor') {
            $tutorCourseIds = Course::where('user_id', $user->id)->pluck('id');

            $tutorStudents = Enrollment::with(['user:id,name,email', 'course:id,title'])
                ->whereIn('course_id', $tutorCourseIds)
                ->latest()
                ->get();

            $tutorCourseBreakdown = Course::where('user_id', $user->id)
                ->withCount('enrollments')
                ->withSum('enrollments', 'amount_paid')
                ->get(['id', 'title', 'price']);

            $stats = [
                'total_courses' => $tutorCourseIds->count(),
                'total_students' => $tutorStudents->unique('user_id')->count(),
                'total_tutors' => 0,
                'total_earnings' => $tutorStudents->sum('amount_paid'),
                'total_withdrawals' => 0,
            ];
        } elseif ($user->role === 'admin') {
            $stats = [
                'total_courses' => Course::count(),
                'total_students' => User::where('role', 'student')->count(),
                'total_tutors' => User::where('role', 'tutor')->count(),
                'total_earnings' => DB::table('enrollments')->sum('amount_paid'),
                'total_withdrawals' => 0,
            ];
        } else {
            $stats = [
                'total_courses' => $enrolledCourses->count(),
                'total_students' => 0,
                'total_tutors' => 0,
                'total_earnings' => 0,
                'total_withdrawals' => 0,
            ];
        }

        return inertia('Dashboard', [
            'auth' => ['user' => $user],
            'stats' => $stats,
            'courses' => $courses,
            'enrolledCourses' => $enrolledCourses,
            'faculties' => Faculty::all(),
            'lessons' => Lesson::all(),
            'tutor_students' => $tutorStudents,
            'tutor_course_breakdown' => $tutorCourseBreakdown,
            'recent_activities' => [],
            'user_data' => ['enrolled_track' => 'Student'],
        ]);
    }
}