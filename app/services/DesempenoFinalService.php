<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DesempenoFinalService
{
    // =========================
    // LISTADO GENERAL (VISTA)
    // =========================
    public static function listar()
    {
        return DB::table('cup.v_desempeno_postulante')
            ->orderByDesc('promedio_final')
            ->get();
    }

    // =========================
    // SOLO APROBADOS
    // =========================
    public static function aprobados()
    {
        return DB::table('cup.v_desempeno_postulante')
            ->where('aprobado', true)
            ->orderByDesc('promedio_final')
            ->get();
    }

    // =========================
    // EJECUTAR PROCEDIMIENTO
    // =========================
    public static function generar()
    {
        return DB::statement("CALL cup.p_generar_resultado_admision()");
    }
}