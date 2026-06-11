<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ControlAsistenciaService;

class ControlAsistenciaController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ControlAsistencia');
    }

    public function data()
    {
        return response()->json(
            ControlAsistenciaService::obtenerAgenda()
        );
    }

    public function store(Request $request)
    {
      $fecha = Carbon::parse($request->fecha)->format('Y-m-d');
    $hoy = Carbon::today()->format('Y-m-d');

    if ($fecha > $hoy) {
        return response()->json([
            'message' => 'No se puede registrar asistencia en fechas futuras.'
        ], 422);
    }



        $request->validate([
            'id_docente' => 'required',
            'id_grupo' => 'required',
            'id_materia' => 'required',
            'fecha' => 'required',
            'tiene_asistencia' => 'required|boolean',
        ]);

        ControlAsistenciaService::guardarAsistencia(
            $request->all()
        );

        return response()->json([
            'success' => true
        ]);
    }
}