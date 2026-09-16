<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Legacy cohort joins created membership only. Never overwrite paid access.
        DB::table('cohort_students as cs')->join('cohorts as c', 'c.id', '=', 'cs.cohort_id')
            ->select('cs.id', 'cs.user_id', 'c.course_id')->orderBy('cs.id')
            ->chunkById(200, function ($members) {
                foreach ($members as $member) {
                    DB::transaction(function () use ($member) {
                        DB::table('users')->where('id', $member->user_id)->lockForUpdate()->first();
                        if (!DB::table('enrollments')->where('user_id', $member->user_id)->where('course_id', $member->course_id)->exists()) {
                            DB::table('enrollments')->insert(['user_id' => $member->user_id, 'course_id' => $member->course_id, 'amount_paid' => 0, 'created_at' => now(), 'updated_at' => now()]);
                        }
                    });
                }
            }, 'cs.id', 'id');
    }

    public function down(): void
    {
        // Restored course access is retained on rollback to avoid removing student access.
    }
};
