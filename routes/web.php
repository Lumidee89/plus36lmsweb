<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\CourseController;
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
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::post('/lessons', [CourseController::class, 'storeLesson'])->name('lessons.store');
    Route::post('/topics', [CourseController::class, 'storeTopic'])->name('topics.store');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/faculties', [FacultyController::class, 'store'])->name('faculties.store');
});

require __DIR__.'/auth.php';