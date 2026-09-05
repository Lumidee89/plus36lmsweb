<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active');
            $table->json('settings')->nullable();
            $table->timestamps();
        });
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->decimal('price', 12, 2)->default(0);
            $table->string('interval')->default('monthly');
            $table->json('features')->nullable();
            $table->timestamps();
        });
        DB::table('subscription_plans')->insert([
            ['name' => 'Starter', 'code' => 'starter', 'price' => 0, 'interval' => 'monthly', 'features' => json_encode(['courses' => 5, 'students' => 100]), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Academy', 'code' => 'academy', 'price' => 50000, 'interval' => 'monthly', 'features' => json_encode(['courses' => -1, 'students' => 1000, 'cohorts' => true]), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Enterprise', 'code' => 'enterprise', 'price' => 500000, 'interval' => 'yearly', 'features' => json_encode(['courses' => -1, 'students' => -1, 'academics' => true, 'support' => true]), 'created_at' => now(), 'updated_at' => now()],
        ]);
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('trialing');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->string('provider_reference')->nullable();
            $table->timestamps();
        });
        Schema::create('cohorts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
        Schema::create('cohort_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cohort_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['cohort_id', 'user_id']);
        });
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->timestamps();
            $table->unique(['organization_id', 'code']);
        });
        Schema::create('academic_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->boolean('is_current')->default(false);
            $table->timestamps();
        });
        Schema::create('device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token')->unique();
            $table->string('platform')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('title')->default('Study session');
            $table->json('messages')->nullable();
            $table->timestamps();
        });
        Schema::create('offline_sync_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('client_id');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action');
            $table->json('payload')->nullable();
            $table->string('status')->default('processed');
            $table->timestamps();
            $table->unique(['user_id', 'client_id']);
        });
    }

    public function down(): void
    {
        foreach (['offline_sync_records', 'ai_conversations', 'device_tokens', 'academic_sessions', 'departments', 'cohort_students', 'cohorts', 'subscriptions', 'subscription_plans'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('courses', fn (Blueprint $table) => $table->dropConstrainedForeignId('organization_id'));
        Schema::table('users', fn (Blueprint $table) => $table->dropConstrainedForeignId('organization_id'));
        Schema::dropIfExists('organizations');
    }
};
