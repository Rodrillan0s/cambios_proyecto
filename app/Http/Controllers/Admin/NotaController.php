<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\NotaService;

class NotaController extends Controller
{
    // =========================
    // VISTA
    // =========================
    public function index()
    {
        return inertia('Admin/Notas');
    }

    // =========================
    // DATA
    // =========================
    public function data()
    {
        return response()->json(
            NotaService::listar()
        );
    }

    // =========================
    // MATERIAS
    // =========================
    public function materias()
    {
        return response()->json(
            NotaService::materias()
        );
    }

    // =========================
    // GUARDAR
    // =========================
    public function store(Request $request)
    {
        $request->validate([
            'ci' => 'required',
            'id_materia' => 'required',
            'nro_examen' => 'required',
            'nota' => 'required'
        ]);

        try {
            NotaService::registrar($request->all());

            return response()->json(['ok' => true]);

        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'msg' => $e->getMessage()
            ], 400);
        }
    }

    // =========================
    // ACTUALIZAR
    // =========================
    public function update(Request $request, $id)
    {
        return response()->json(
            NotaService::actualizar($id, $request->all())
        );
    }

    // =========================
    // ELIMINAR
    // =========================
    public function destroy($id)
    {
        return response()->json(
            NotaService::eliminar($id)
        );
    }

    // =========================
    // IMPORTAR EXCEL
    // =========================
    public function importar(Request $request)
    {
        $request->validate([
            'file' => 'required|file'
        ]);

        NotaService::importarExcel($request->file('file'));

        return response()->json([
            'ok' => true,
            'msg' => 'Importación exitosa'
        ]);
    }
}