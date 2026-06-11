<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\LicenciaDocenteService;
use Inertia\Inertia;

class LicenciaDocenteController extends Controller
{
    // 👉 Página Inertia (FRONT)
    public function index()
    {
        return Inertia::render('Admin/LicenciasDocente');
    }

    // 👉 API JSON (LISTAR LICENCIAS)
    public function data()
    {
        return response()->json(
            LicenciaDocenteService::listar()
        );
    }

    // 👉 API JSON (LISTAR DOCENTES)
    public function docentes()
    {
        return response()->json(
            LicenciaDocenteService::docentes()
        );
    }

    // 👉 CREAR LICENCIA
    public function store(Request $request)
    {
        $request->validate([
            'id_docente'   => 'required',
            'fecha_inicio' => 'required',
            'fecha_fin'    => 'required',
            'motivo'       => 'required'
        ]);

        LicenciaDocenteService::registrar(
            $request->all()
        );

        return response()->json([
            'ok' => true
        ]);
    }

    // 👉 ELIMINAR LICENCIA
    public function destroy($id)
    {
        LicenciaDocenteService::eliminar($id);

        return response()->json([
            'ok' => true
        ]);
    }
}