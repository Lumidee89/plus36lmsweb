<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('status')->default('published')->after('duration');
            $table->timestamp('published_at')->nullable()->after('status');
        });

        Schema::create('course_weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();
        });

        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_week_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('course_module_id')->nullable()->after('course_id')->constrained()->nullOnDelete();
            $table->unsignedInteger('estimated_minutes')->default(10)->after('order');
            $table->boolean('is_preview')->default(false)->after('estimated_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_module_id');
            $table->dropColumn(['estimated_minutes', 'is_preview']);
        });
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('course_weeks');
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['status', 'published_at']);
        });
    }
};
