<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgressController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
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

    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::get('/courses/enrolled', [CourseController::class, 'enrolled']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::post('/courses/{course}/lessons', [CourseController::class, 'storeLesson']);
    Route::post('/lessons/{lesson}/topics', [CourseController::class, 'storeTopic']);
    Route::post('/courses/{course}/enroll', [CourseController::class, 'enroll']);

    Route::get('/progress', [ProgressController::class, 'show']);
    Route::post('/progress/ping', [ProgressController::class, 'ping']);
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
