<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Faculty;
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

        // 1. Handle Stats logic
        if ($role === 'admin') {
            $stats = [
                'total_tutors'      => User::where('role', 'tutor')->count(),
                'total_students'    => User::where('role', 'student')->count(),
                'total_earnings'    => DB::table('payments')->sum('amount'), 
                'total_withdrawals' => DB::table('withdrawals')->where('status', 'completed')->sum('amount'),
            ];
        } elseif ($role === 'tutor') {
            $stats = [
                'total_courses'     => Course::where('user_id', $user->id)->count(),
                'total_students'    => DB::table('enrollments')
                                        ->join('courses', 'enrollments.course_id', '=', 'courses.id')
                                        ->where('courses.user_id', $user->id)
                                        ->count(),
                'total_earnings'    => DB::table('tutor_earnings')->where('user_id', $user->id)->sum('amount'),
                'total_withdrawals' => DB::table('withdrawals')->where('user_id', $user->id)->sum('amount'),
            ];
        } elseif ($role === 'student') {
            $stats = [
                'total_courses'     => DB::table('enrollments')->where('user_id', $user->id)->count(),
            ];
        }

        // 2. Handle Data logic (Determine what courses/lessons to show)
        if ($role === 'admin') {
            // Admin sees everything
            $courses = Course::with(['lessons.topics', 'user'])->get(); 
            $lessons = Lesson::all();
        } else {
            // Tutors and Students see their specific courses
            $courses = Course::where('user_id', $user->id)
                            ->with(['lessons.topics'])
                            ->get();
            $lessons = Lesson::whereIn('course_id', function($query) use ($user) {
                            $query->select('id')->from('courses')->where('user_id', $user->id);
                        })->get();
        }

        // 3. Return the data (Cleaned up the duplicate array keys)
        return Inertia::render('Dashboard', [
            'user_data' => [
                'enrolled_track' => $user->enrolled_track ?? 'None, Enroll Now!',
                'student_id_prefix' => 'P36',
            ],
            'faculties' => Faculty::all(),
            'courses'   => $courses, // Uses the variable defined in step 2
            'lessons'   => $lessons, // Uses the variable defined in step 2
            'stats'     => $stats,
            'recent_activities' => ($user && method_exists($user, 'activities')) ? $user->activities()->latest()->limit(5)->get() : collect(),
        ]);
    }
}