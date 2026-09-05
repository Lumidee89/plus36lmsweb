<?php

use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::get('/', [SiteController::class, 'index'])->name('home');

Route::get('/dashboard', [SiteController::class, 'dashboard'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/courses/{course}', [CourseController::class, 'show'])->name('courses.show');

    Route::middleware('role:admin,tutor')->group(function () {
        Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
        Route::post('/courses/{course}/weeks', [CourseController::class, 'storeWeek'])->name('course-weeks.store');
        Route::post('/course-weeks/{week}/modules', [CourseController::class, 'storeModule'])->name('course-modules.store');
        Route::post('/lessons', [CourseController::class, 'storeLesson'])->name('lessons.store');
        Route::post('/topics', [CourseController::class, 'storeTopic'])->name('topics.store');
        Route::post('/lessons/{lesson}/assignment', [AssignmentController::class, 'store'])->name('assignments.store');
        Route::patch('/course-weeks/{week}', [CourseController::class, 'updateWeek'])->name('course-weeks.update');
        Route::delete('/course-weeks/{week}', [CourseController::class, 'destroyWeek'])->name('course-weeks.destroy');
        Route::patch('/course-modules/{module}', [CourseController::class, 'updateModule'])->name('course-modules.update');
        Route::delete('/course-modules/{module}', [CourseController::class, 'destroyModule'])->name('course-modules.destroy');
        Route::patch('/lessons/{lesson}', [CourseController::class, 'updateLesson'])->name('lessons.update');
        Route::delete('/lessons/{lesson}', [CourseController::class, 'destroyLesson'])->name('lessons.destroy');
        Route::patch('/topics/{topic}', [CourseController::class, 'updateTopic'])->name('topics.update');
        Route::delete('/topics/{topic}', [CourseController::class, 'destroyTopic'])->name('topics.destroy');
        Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy'])->name('assignments.destroy');
        Route::post('/assignments/{assignment}/questions', [AssignmentController::class, 'storeQuestion'])->name('assignment.questions.store');
        Route::delete('/assignment-questions/{question}', [AssignmentController::class, 'deleteQuestion'])->name('assignment.questions.destroy');
        Route::patch('/assignment-questions/{question}', [AssignmentController::class, 'updateQuestion'])->name('assignment.questions.update');
    });

    Route::middleware('role:tutor')->group(function () {
        Route::post('/withdrawals', [WithdrawalController::class, 'store'])->name('withdrawals.store');
        Route::post('/exams', [ExamController::class, 'store'])->name('exams.store');
        Route::post('/exam-questions', [ExamController::class, 'storeQuestion'])->name('exam.questions.store');
        Route::delete('/exam-questions/{question}', [ExamController::class, 'deleteQuestion'])->name('exam.questions.destroy');
        Route::patch('/assignment-submissions/{submission}', [AssignmentController::class, 'review'])->name('assignment-submissions.review');
    });

    Route::middleware('role:student')->group(function () {
        Route::post('/courses/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');
        Route::get('/progress', [ProgressController::class, 'show'])->name('progress');
        Route::post('/progress/ping', [ProgressController::class, 'ping'])->name('progress.ping');
        Route::post('/progress/check-in', [ProgressController::class, 'checkIn'])->name('progress.check-in');
        Route::post('/lessons/{lesson}/complete', [ProgressController::class, 'completeLesson'])->name('lessons.complete');
        Route::get('/courses/{course}/exam', [ExamController::class, 'show'])->name('courses.exam');
        Route::post('/exams/{exam}/attempt', [ExamController::class, 'submitAttempt'])->name('exams.submit');
        Route::post('/assignments/{assignment}/submit', [AssignmentController::class, 'submit'])->name('assignments.submit');
    });

    Route::get('/certificates/{certificate}', [CertificateController::class, 'show'])
        ->middleware('role:student,admin')
        ->name('certificates.show');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/platform/organizations', [PlatformController::class, 'createOrganization']);
    Route::post('/platform/subscriptions', [PlatformController::class, 'subscribe']);
    Route::post('/platform/cohorts', [PlatformController::class, 'createCohort']);
    Route::post('/platform/departments', [PlatformController::class, 'createDepartment']);
    Route::post('/platform/academic-sessions', [PlatformController::class, 'createAcademicSession']);
    Route::post('/admin/banners', [BannerController::class, 'store'])->name('banners.store');
    Route::delete('/admin/banners/{banner}', [BannerController::class, 'destroy'])->name('banners.destroy');
    Route::post('/faculties', [FacultyController::class, 'store'])->name('faculties.store');
    Route::patch('/courses/{course}/publish', [CourseController::class, 'publish'])->name('courses.publish');
    Route::post('/withdrawals/{withdrawal}/approve', [WithdrawalController::class, 'approve'])->name('withdrawals.approve');
    Route::post('/withdrawals/{withdrawal}/decline', [WithdrawalController::class, 'decline'])->name('withdrawals.decline');
});

require __DIR__.'/auth.php';
