<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\DocenteService;

class DocenteController extends Controller
{
    public function index()
    {
        return response()->json(DocenteService::listar());
    }

    public function data()
    {
        return $this->index();
    }

    public function store(Request $request)
    {
        $request->validate([
            'ci' => 'required',
            'nombres' => 'required',
            'apellidos' => 'required',
        ]);

        $id = DocenteService::registrar($request->all());

        \App\Services\BitacoraService::registrar('DOCENTES', 'REGISTRAR DOCENTE', "Docente registrado: {$request->nombres} {$request->apellidos} (CI: {$request->ci})");

        return response()->json([
            'ok' => true,
            'id_docente' => $id
        ]);
    }

    public function update(Request $request, $id)
    {
        $res = DocenteService::actualizar($id, $request->all());
        \App\Services\BitacoraService::registrar('DOCENTES', 'MODIFICAR DOCENTE', "Docente modificado ID: {$id}, Datos: " . json_encode($request->only('nombres', 'apellidos', 'ci')));
        return response()->json($res);
    }

    public function destroy($id)
    {
        $res = DocenteService::eliminar($id);
        \App\Services\BitacoraService::registrar('DOCENTES', 'ELIMINAR DOCENTE', "Docente eliminado ID: {$id}");
        return response()->json($res);
    }

    public function asignarMateria(Request $request)
    {
        $res = DocenteService::asignarMateria($request->all());
        \App\Services\BitacoraService::registrar('DOCENTES', 'ASIGNAR MATERIA', "Materia asignada a docente. Docente ID: {$request->id_docente}, Materia ID: {$request->id_materia}, Grupo ID: {$request->id_grupo}");
        return response()->json($res);
    }

    public function quitarMateria(Request $request)
    {
        $res = DocenteService::quitarMateria(
            $request->id_docente,
            $request->id_grupo,
            $request->id_materia
        );
        \App\Services\BitacoraService::registrar('DOCENTES', 'QUITAR MATERIA', "Materia desasignada de docente. Docente ID: {$request->id_docente}, Materia ID: {$request->id_materia}, Grupo ID: {$request->id_grupo}");
        return response()->json($res);
    }
}