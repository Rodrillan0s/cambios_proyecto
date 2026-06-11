<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\LicenciaDocenteService;

use Inertia\Inertia;
class LicenciaDocenteController extends Controller
{


public function index()
{
    return Inertia::render('Admin/LicenciasDocente');
}

    public function data()
    {
        return $this->index();
    }

    public function docentes()
    {
        return response()->json(
            LicenciaDocenteService::docentes()
        );
    }

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

    public function destroy($id)
    {
        LicenciaDocenteService::eliminar($id);

        return response()->json([
            'ok' => true
        ]);
    }
}