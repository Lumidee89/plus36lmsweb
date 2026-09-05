<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('certificates', fn (Blueprint $table) => $table->unique(['user_id', 'course_id'], 'certificates_user_course_unique'));
    }

    public function down(): void
    {
        Schema::table('certificates', fn (Blueprint $table) => $table->dropUnique('certificates_user_course_unique'));
    }
};
