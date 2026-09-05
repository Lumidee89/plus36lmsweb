<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\BannerController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/banners', [BannerController::class, 'index']);
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle'])
    ->name('api.auth.google.redirect');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])
    ->name('api.auth.google.callback');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    Route::get('/recent-activities', [ProfileController::class, 'recentActivities']);
    Route::get('/platform', [PlatformController::class, 'overview']);
    Route::post('/organizations', [PlatformController::class, 'createOrganization']);
    Route::get('/subscription-plans', [PlatformController::class, 'plans']);
    Route::post('/subscriptions', [PlatformController::class, 'subscribe']);
    Route::get('/cohorts', [PlatformController::class, 'cohorts']);
    Route::post('/cohorts', [PlatformController::class, 'createCohort']);
    Route::post('/cohorts/{cohort}/join', [PlatformController::class, 'joinCohort']);
    Route::post('/departments', [PlatformController::class, 'createDepartment']);
    Route::post('/academic-sessions', [PlatformController::class, 'createAcademicSession']);
    Route::post('/devices', [PlatformController::class, 'registerDevice']);
    Route::post('/sync', [PlatformController::class, 'sync']);
    Route::post('/ai/ask', [PlatformController::class, 'askAi']);

    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::post('/courses/{course}/weeks', [CourseController::class, 'storeWeek']);
    Route::post('/course-weeks/{week}/modules', [CourseController::class, 'storeModule']);
    Route::get('/courses/enrolled', [CourseController::class, 'enrolled']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::post('/courses/{course}/lessons', [CourseController::class, 'storeLesson']);
    Route::post('/lessons/{lesson}/topics', [CourseController::class, 'storeTopic']);
    Route::post('/lessons/{lesson}/assignment', [AssignmentController::class, 'store']);
    Route::post('/assignments/{assignment}/questions', [AssignmentController::class, 'storeQuestion']);
    Route::delete('/assignment-questions/{question}', [AssignmentController::class, 'deleteQuestion']);
    Route::post('/assignments/{assignment}/attempt', [AssignmentController::class, 'attempt']);
    Route::post('/assignments/{assignment}/submit', [AssignmentController::class, 'submit']);
    Route::get('/assessment-results', [AssignmentController::class, 'results']);
    Route::patch('/assignment-submissions/{submission}', [AssignmentController::class, 'review']);
    Route::post('/courses/{course}/enroll', [CourseController::class, 'enroll']);

    Route::get('/progress', [ProgressController::class, 'show']);
    Route::post('/progress/ping', [ProgressController::class, 'ping']);
    Route::post('/progress/check-in', [ProgressController::class, 'checkIn']);
    Route::post('/lessons/{lesson}/complete', [ProgressController::class, 'completeLesson']);

    // Exam — tutor management
    Route::post('/exams', [ExamController::class, 'store']);
    Route::post('/exam-questions', [ExamController::class, 'storeQuestion']);
    Route::delete('/exam-questions/{question}', [ExamController::class, 'deleteQuestion']);
    Route::get('/courses/{course}/exam/manage', [ExamController::class, 'manage']);

    // Exam — student
    Route::get('/courses/{course}/exam', [ExamController::class, 'show']);
    Route::post('/exams/{exam}/attempt', [ExamController::class, 'submitAttempt']);

    // Certificates
    Route::get('/certificates', [ExamController::class, 'certificates']);
    Route::get('/certificates/{certificate}', [ExamController::class, 'showCertificate']);
});
