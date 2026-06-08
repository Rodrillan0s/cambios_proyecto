<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\HorarioService;

class HorarioController extends Controller
{
    // =========================
    // VISTA PRINCIPAL
    // =========================
    public function index()
    {
        return Inertia::render('Admin/GestionarHorarios');
    }

    // =========================
    // DATA GLOBAL
    // =========================
    public function data(Request $request)
    {
        return response()->json(
            HorarioService::obtenerTodos($request->all())
        );
    }

    // =========================
    // HORARIOS POR GRUPO
    // =========================
    public function porGrupo($idGrupo)
    {
        return response()->json(
            HorarioService::obtenerPorGrupo($idGrupo)
        );
    }

    // =========================
    // BLOQUES DISPONIBLES DEL GRUPO
    // =========================
    public function bloquesPorGrupo($idGrupo)
    {
        return response()->json(
            HorarioService::obtenerBloquesPorGrupo($idGrupo)
        );
    }

    // =========================
    // ASIGNAR HORARIO
    // =========================
    public function store(Request $request)
    {
        $request->validate([
            'id_grupo'    => 'required|integer',
            'id_materia'  => 'required|integer',
            'tipo'        => 'required|string',
            'hora_inicio' => 'required',
            'hora_fin'    => 'required',
        ]);

        $resultado = HorarioService::asignarHorario(
            $request->all()
        );

        return response()->json([
            'success' => (bool) $resultado,
            'message' => $resultado
                ? 'Horario asignado correctamente'
                : 'La materia ya existe o el bloque está ocupado'
        ]);
    }

    // =========================
    // ACTUALIZAR HORARIO
    // =========================
    public function update(Request $request)
    {
        $request->validate([
            'id_grupo'    => 'required|integer',
            'id_materia'  => 'required|integer',
            'tipo'        => 'required|string',
            'hora_inicio' => 'required',
            'hora_fin'    => 'required',
        ]);

        $resultado = HorarioService::actualizarHorario(
            $request->all()
        );

        return response()->json([
            'success' => (bool) $resultado,
            'message' => $resultado
                ? 'Horario actualizado correctamente'
                : 'No fue posible actualizar el horario'
        ]);
    }

    // =========================
    // ELIMINAR HORARIO
    // =========================
public function destroy(Request $request)
{
    $request->validate([
        'id_grupo'   => 'required|integer',
        'id_materia' => 'required|integer',
    ]);

    HorarioService::eliminarHorario(
        $request->id_grupo,
        $request->id_materia
    );

    return response()->json([
        'success' => true,
        'message' => 'Horario eliminado correctamente'
    ]);
}
    // =========================
// BLOQUES DISPONIBLES
// =========================
public function bloquesDisponibles($idGrupo)
{
    return response()->json(
        HorarioService::obtenerBloquesDisponibles($idGrupo)
    );
}
}