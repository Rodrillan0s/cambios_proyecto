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
        Schema::table('cup.t_usuario', function (Blueprint $table) {
            $table->boolean('cambiar_password')->default(true);
        });

        // Marcar cambiar_password como false para usuarios existentes
        \Illuminate\Support\Facades\DB::table('cup.t_usuario')->update(['cambiar_password' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cup.t_usuario', function (Blueprint $table) {
            $table->dropColumn('cambiar_password');
        });
    }
};
