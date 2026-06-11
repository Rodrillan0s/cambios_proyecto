<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class LicenciaDocenteService
{
    public static function listar()
    {
        return DB::table('cup.t_licencia_docente as l')
            ->join(
                'cup.t_docente as d',
                'd.id_docente',
                '=',
                'l.id_docente'
            )
            ->select(
                'l.*',
                DB::raw("
                    d.nombres || ' ' || d.apellidos
                    as docente
                ")
            )
            ->orderBy('l.fecha_inicio', 'desc')
            ->get();
    }

    public static function docentes()
    {
        return DB::table('cup.t_docente')
            ->select(
                'id_docente',
                'nombres',
                'apellidos'
            )
            ->orderBy('apellidos')
            ->get();
    }

    public static function registrar(array $data)
    {
        return DB::table('cup.t_licencia_docente')
            ->insert([
                'id_docente'   => $data['id_docente'],
                'fecha_inicio' => $data['fecha_inicio'],
                'fecha_fin'    => $data['fecha_fin'],
                'motivo'       => $data['motivo'],
                'observacion'  => $data['observacion'] ?? null,
                'fecha_registro' => now()
            ]);
    }

    public static function eliminar($id)
    {
        return DB::table('cup.t_licencia_docente')
            ->where('id_licencia', $id)
            ->delete();
    }
}