<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cohorts', function (Blueprint $table) {
            // Existing cohorts retain their previous free enrollment behavior.
            $table->decimal('price', 12, 2)->default(0);
        });
        Schema::create('cohort_checkouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cohort_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending');
            $table->text('authorization_url')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->index(['cohort_id', 'status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cohort_checkouts');
        Schema::table('cohorts', fn (Blueprint $table) => $table->dropColumn('price'));
    }
};
