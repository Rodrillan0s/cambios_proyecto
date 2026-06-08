<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class GrupoService
{
    public static function generarGrupos(string $gestion)
    {
        DB::statement(
            "CALL cup.p_generar_grupos(?)",
            [$gestion]
        );

        return true;
    }

public static function obtenerResumen(string $gestion)
{
    return DB::table('cup.t_grupo')
        ->orderBy('id_grupo')
        ->get();
}

    public static function obtenerEstudiantesGrupo(int $idGrupo)
    {
        return DB::table('cup.v_grupo_estudiantes')
            ->where('id_grupo', $idGrupo)
            ->orderBy('apellidos')
            ->orderBy('nombre')
            ->get();
    }


public static function estadisticas(string $gestion)
{
    $grupos = DB::table('cup.v_grupos_resumen')
        ->where('gestion', $gestion)
        ->count();

    $estudiantes = DB::table('cup.v_grupo_base')
        ->where('gestion', $gestion)
        ->sum('cantidad_estudiantes');

    return [
        'grupos' => $grupos,
        'estudiantes' => $estudiantes,
        'capacidad' => $grupos * 70
    ];
}
}