<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [SiteController::class, 'index'])->name('home');

Route::get('/dashboard', [SiteController::class, 'dashboard'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/courses/{course}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::post('/lessons', [CourseController::class, 'storeLesson'])->name('lessons.store');
    Route::post('/topics', [CourseController::class, 'storeTopic'])->name('topics.store');
    Route::post('/courses/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');

    Route::post('/withdrawals', [WithdrawalController::class, 'store'])->name('withdrawals.store');

    Route::get('/progress', [ProgressController::class, 'show'])->name('progress');
    Route::post('/progress/ping', [ProgressController::class, 'ping'])->name('progress.ping');
    Route::post('/lessons/{lesson}/complete', [ProgressController::class, 'completeLesson'])->name('lessons.complete');

    Route::post('/exams', [ExamController::class, 'store'])->name('exams.store');
    Route::post('/exam-questions', [ExamController::class, 'storeQuestion'])->name('exam.questions.store');
    Route::delete('/exam-questions/{question}', [ExamController::class, 'deleteQuestion'])->name('exam.questions.destroy');
    Route::get('/courses/{course}/exam', [ExamController::class, 'show'])->name('courses.exam');
    Route::post('/exams/{exam}/attempt', [ExamController::class, 'submitAttempt'])->name('exams.submit');
    Route::get('/certificates/{certificate}', [CertificateController::class, 'show'])->name('certificates.show');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/faculties', [FacultyController::class, 'store'])->name('faculties.store');
    Route::post('/withdrawals/{withdrawal}/approve', [WithdrawalController::class, 'approve'])->name('withdrawals.approve');
    Route::post('/withdrawals/{withdrawal}/decline', [WithdrawalController::class, 'decline'])->name('withdrawals.decline');
});

require __DIR__.'/auth.php';