<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assignments', fn (Blueprint $table) => $table->string('type')->default('project')->after('title'));
        Schema::create('assignment_questions', function (Blueprint $table) {
            $table->id(); $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->text('question'); $table->unsignedInteger('position')->default(1); $table->timestamps();
        });
        Schema::create('assignment_options', function (Blueprint $table) {
            $table->id(); $table->foreignId('assignment_question_id')->constrained()->cascadeOnDelete();
            $table->string('option_text', 500); $table->boolean('is_correct')->default(false); $table->timestamps();
        });
        Schema::create('assignment_attempts', function (Blueprint $table) {
            $table->id(); $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); $table->unsignedInteger('score');
            $table->unsignedInteger('correct_answers'); $table->unsignedInteger('total_questions');
            $table->boolean('passed'); $table->timestamps();
        });
        Schema::create('assignment_answers', function (Blueprint $table) {
            $table->id(); $table->foreignId('assignment_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_option_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_correct')->default(false); $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_answers'); Schema::dropIfExists('assignment_attempts');
        Schema::dropIfExists('assignment_options'); Schema::dropIfExists('assignment_questions');
        Schema::table('assignments', fn (Blueprint $table) => $table->dropColumn('type'));
    }
};
