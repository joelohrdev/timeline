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
        Schema::table('entries', function (Blueprint $table) {
            $table->string('location_place', 120)->nullable()->after('title');
            $table->string('location_city', 120)->nullable()->after('location_place');
            $table->string('location_state', 60)->nullable()->after('location_city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entries', function (Blueprint $table) {
            $table->dropColumn(['location_place', 'location_city', 'location_state']);
        });
    }
};
