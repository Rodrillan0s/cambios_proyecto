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

            \App\Services\BitacoraService::registrar('NOTAS', 'REGISTRAR NOTA', "Nota registrada para CI: {$request->ci}, Examen: {$request->nro_examen}, Materia ID: {$request->id_materia}, Nota: {$request->nota}");

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
        $res = NotaService::actualizar($id, $request->all());
        \App\Services\BitacoraService::registrar('NOTAS', 'MODIFICAR NOTA', "Nota modificada ID: {$id}, Nueva Nota: " . ($request->nota ?? '-'));
        return response()->json($res);
    }

    // =========================
    // ELIMINAR
    // =========================
    public function destroy($id)
    {
        $res = NotaService::eliminar($id);
        \App\Services\BitacoraService::registrar('NOTAS', 'ELIMINAR NOTA', "Nota eliminada ID: {$id}");
        return response()->json($res);
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

        \App\Services\BitacoraService::registrar('NOTAS', 'IMPORTAR NOTAS EXCEL', "Importación masiva de notas desde archivo Excel");

        return response()->json([
            'ok' => true,
            'msg' => 'Importación exitosa'
        ]);
    }
}