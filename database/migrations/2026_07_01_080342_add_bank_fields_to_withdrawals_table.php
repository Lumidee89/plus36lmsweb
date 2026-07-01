<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('account_name')->after('amount');
            $table->string('account_number')->after('account_name');
            $table->string('bank_name')->after('account_number');
            $table->text('admin_note')->nullable()->after('bank_name');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn(['account_name', 'account_number', 'bank_name', 'admin_note']);
        });
    }
};
