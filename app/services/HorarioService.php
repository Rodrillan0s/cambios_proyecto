<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class HorarioService
{
    // =========================
    // OBTENER POR GRUPO
    // =========================
    public static function obtenerPorGrupo($idGrupo)
    {
        return DB::table('cup.v_horarios_grupo')
            ->where('id_grupo', $idGrupo)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();
    }

    // =========================
    // OBTENER TODOS
    // =========================
    public static function obtenerTodos($filtros = [])
    {
        $query = DB::table('cup.v_horarios_grupo');

        if (!empty($filtros['id_grupo'])) {
            $query->where('id_grupo', $filtros['id_grupo']);
        }

        if (!empty($filtros['id_materia'])) {
            $query->where('id_materia', $filtros['id_materia']);
        }

        if (!empty($filtros['dia_semana'])) {
            $query->where('dia_semana', $filtros['dia_semana']);
        }

        return $query
            ->orderBy('id_grupo')
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();
    }

    // =========================
    // BLOQUES SEGÚN TURNO DEL GRUPO
    // =========================
    public static function obtenerBloquesPorGrupo($idGrupo)
    {
        $grupo = DB::table('cup.t_grupo')
            ->where('id_grupo', $idGrupo)
            ->first();

        if (!$grupo) {
            return [];
        }

        return DB::table('cup.t_bloques_horarios')
            ->where('id_turno', $grupo->id_turno)
            ->orderBy('tipo')
            ->orderBy('hora_inicio')
            ->get();
    }

    // =========================
    // ASIGNAR HORARIO
    // =========================
    public static function asignarHorario($data)
    {
        // Evitar materia repetida
        $materiaExiste = DB::table('cup.t_carga_horaria')
            ->where('id_grupo', $data['id_grupo'])
            ->where('id_materia', $data['id_materia'])
            ->exists();

        if ($materiaExiste) {
            return false;
        }

        $dias = [];

        if ($data['tipo'] === 'LV') {
            $dias = ['lunes', 'miercoles', 'viernes'];
        }

        if ($data['tipo'] === 'MJ') {
            $dias = ['martes', 'jueves'];
        }

        $registros = [];

        foreach ($dias as $dia) {

            // Evitar que otro horario ocupe el mismo bloque
            $bloqueOcupado = DB::table('cup.t_carga_horaria')
                ->where('id_grupo', $data['id_grupo'])
                ->where('dia_semana', $dia)
                ->where('hora_inicio', $data['hora_inicio'])
                ->where('hora_fin', $data['hora_fin'])
                ->exists();

            if (!$bloqueOcupado) {
                $registros[] = [
                    'id_grupo'    => $data['id_grupo'],
                    'id_materia'  => $data['id_materia'],
                    'dia_semana'  => $dia,
                    'hora_inicio' => $data['hora_inicio'],
                    'hora_fin'    => $data['hora_fin'],
                ];
            }
        }

        if (empty($registros)) {
            return false;
        }

        return DB::table('cup.t_carga_horaria')
            ->insert($registros);
    }

    // =========================
    // ACTUALIZAR HORARIO
    // =========================
    public static function actualizarHorario($data)
    {
        self::eliminarHorario(
            $data['id_grupo'],
            $data['id_materia']
        );

        return self::asignarHorario($data);
    }

    // =========================
    // ELIMINAR HORARIO
    // =========================
public static function eliminarHorario($idGrupo, $idMateria)
{
    $deleted = DB::table('cup.t_carga_horaria')
        ->where('id_grupo', $idGrupo)
        ->where('id_materia', $idMateria)
        ->delete();

    return $deleted > 0;
}

    // =========================
// BLOQUES DISPONIBLES
// =========================
public static function obtenerBloquesDisponibles($idGrupo)
{
    $grupo = DB::table('cup.t_grupo')
        ->where('id_grupo', $idGrupo)
        ->first();

    if (!$grupo) {
        return collect();
    }

    $bloques = DB::table('cup.t_bloques_horarios')
        ->where('id_turno', $grupo->id_turno)
        ->orderBy('tipo')
        ->orderBy('hora_inicio')
        ->get();

    $ocupados = DB::table('cup.t_carga_horaria')
        ->where('id_grupo', $idGrupo)
        ->select(
            'hora_inicio',
            'hora_fin',
            'dia_semana'
        )
        ->get();

    return $bloques->filter(function ($bloque) use ($ocupados) {

        $diasBloque = [];

        if ($bloque->tipo === 'LV') {
            $diasBloque = ['lunes', 'miercoles', 'viernes'];
        }

        if ($bloque->tipo === 'MJ') {
            $diasBloque = ['martes', 'jueves'];
        }

        foreach ($ocupados as $ocupado) {

            if (
                in_array($ocupado->dia_semana, $diasBloque) &&
                $ocupado->hora_inicio == $bloque->hora_inicio &&
                $ocupado->hora_fin == $bloque->hora_fin
            ) {
                return false;
            }
        }

        return true;
    })->values();
}
}