<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ControlAsistenciaService
{
    public static function obtenerAgenda()
    {
        $horarios = DB::table('cup.v_horarios_grupo')
            ->get();

        $resultado = collect();

        foreach ($horarios as $h) {

            if ($h->gestion == '202601') {
                $inicio = Carbon::create(2026, 5, 1);
                $fin = Carbon::create(2026, 6, 31);
            } else {
                $inicio = Carbon::create(2026, 7, 1);
                $fin = Carbon::create(2026, 9, 30);
            }

            $fecha = $inicio->copy();

            while ($fecha <= $fin) {

                $dia = strtolower($fecha->locale('es')->dayName);

                if ($dia == $h->dia_semana) {

                    $asistencia = DB::table('cup.t_asistencia_docente')
                        ->whereDate(
                            'fecha_asistencia',
                            $fecha->format('Y-m-d')
                        )
                        ->where('id_docente', $h->id_docente)
                        ->where('id_grupo', $h->id_grupo)
                        ->where('id_materia', $h->id_materia)
                        ->first();

                    if ($asistencia) {

                        $estado = $asistencia->tiene_asistencia
                            ? 'ASISTIO'
                            : 'FALTO';

                    } else {

                        $estado = $fecha->isPast()
                            ? 'FALTO'
                            : 'PENDIENTE';
                    }

                    $resultado->push([
                        'fecha' => $fecha->format('Y-m-d'),
                        'hora_inicio' => $h->hora_inicio,
                        'hora_fin' => $h->hora_fin,
                        'id_docente' => $h->id_docente,
                        'nombre_docente' => $h->nombre_docente,
                        'id_grupo' => $h->id_grupo,
                        'nombre_grupo' => $h->nombre_grupo,
                        'id_materia' => $h->id_materia,
                        'materia' => $h->materia,
                        'estado' => $estado,
                    ]);
                }

                $fecha->addDay();
            }
        }

        return $resultado
            ->sortBy('fecha')
            ->values();
    }

    public static function guardarAsistencia($data)
    {
        DB::table('cup.t_asistencia_docente')
            ->updateOrInsert(
                [
                    'id_docente' => $data['id_docente'],
                    'id_grupo' => $data['id_grupo'],
                    'id_materia' => $data['id_materia'],
                    'fecha_asistencia' => $data['fecha'],
                ],
                [
                    'tiene_asistencia' => $data['tiene_asistencia'],
                ]
            );
    }
}