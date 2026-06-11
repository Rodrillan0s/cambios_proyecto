<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PostulanteService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;

class PostulanteController extends Controller
{
    public function store(Request $request)
    {
        $datos = $request->all();
        $id = PostulanteService::crearPostulante(
            $datos,
            $request->ip(),
            $pathCedula ?? null,
            $pathBachiller ?? null
        );

        return response()->json([
            'success' => true,
            'id_postulante' => $id
        ]);
    }

    public function index(Request $request)
    {
        if ($request->ajax() && !$request->header('X-Inertia')) {
            $postulantes = PostulanteService::listarPostulantes(
                $request->only(['ci', 'nombre', 'carrera', 'estado_pago', 'gestion']),
                $request->get('per_page', 15)
            );
            return response()->json($postulantes);
        }

        return Inertia::render('Postulantes/GestionarPostulantes'); 
    }

    public function update(Request $request, int $id)
    {
        $ok = PostulanteService::actualizarPostulante(
            $id,
            $request->all(),
            [
                'cedula' => $request->file('cedula'),
                'bachiller' => $request->file('bachiller')
            ],
            $request->ip()
        );

        return response()->json([
            'success' => $ok
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $postulante = DB::table('t_postulante')
            ->where('id_postulante', $id)
            ->first();

        if (!$postulante) {
            return response()->json([
                'success' => false,
                'message' => 'Postulante no encontrado'
            ], 404);
        }

        $ok = PostulanteService::eliminarPostulante(
            $id,
            $postulante->ci,
            $request->ip()
        );

        return response()->json([
            'success' => $ok
        ]);
    }

    public function importarCSV(Request $request): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|mimes:csv,txt,xlsx|max:10240',
        ]);

        try {
            $result = PostulanteService::importarDesdeCSV(
                $request->file('archivo'),
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'message' => "Importación masiva completada.",
                'data' => $result
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Error en la importación: " . $e->getMessage()
            ], 500);
        }
    }
}
