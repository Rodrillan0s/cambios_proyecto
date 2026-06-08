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

        return response()->json([
            'ok' => true,
            'id_docente' => $id
        ]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(
            DocenteService::actualizar($id, $request->all())
        );
    }

    public function asignarMateria(Request $request)
    {
        return response()->json(
            DocenteService::asignarMateria($request->all())
        );
    }

    public function quitarMateria(Request $request)
    {
        return response()->json(
            DocenteService::quitarMateria(
                $request->id_docente,
                $request->id_grupo,
                $request->id_materia
            )
        );
    }
}