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
        Schema::table('entry_images', function (Blueprint $table) {
            $table->string('original_fingerprint', 100)->nullable()->after('position')->index();
            $table->string('taken_key', 40)->nullable()->after('original_fingerprint')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entry_images', function (Blueprint $table) {
            $table->dropColumn(['original_fingerprint', 'taken_key']);
        });
    }
};
