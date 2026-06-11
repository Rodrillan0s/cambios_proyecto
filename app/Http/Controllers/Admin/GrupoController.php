<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\GrupoService;
use Illuminate\Support\Facades\DB;

class GrupoController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/GestionarGrupos');
    }

    // =========================
    // DATA PRINCIPAL (API JSON)
    // =========================
    public function data(Request $request)
    {
        $gestion = $request->get('gestion');

        if (!$gestion) {
            $gestion = DB::table('cup.t_grupo')
                ->orderByDesc('gestion')
                ->value('gestion');
        }

        return response()->json([
            'gestion' => $gestion,
            'estadisticas' => GrupoService::estadisticas($gestion),
            'grupos' => GrupoService::obtenerResumen($gestion)
        ]);
    }

    // =========================
    // GENERAR GRUPOS
    // =========================
    public function generar(Request $request)
    {
        $request->validate([
            'gestion' => 'required|string|size:6'
        ]);

        try {
            GrupoService::generarGrupos($request->gestion);
            
            return response()->json([
                'success' => true,
                'message' => 'Grupos generados correctamente'
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            $message = $e->getMessage();
            if ($e->getCode() === 'P0001' || str_contains($message, 'ERROR:')) {
                if (preg_match('/ERROR:\s*(.+?)(?:\r?\n|CONTEXT|$)/s', $message, $matches)) {
                    $errorText = trim($matches[1]);
                } else {
                    $errorText = 'Error en la base de datos al generar grupos.';
                }
                return response()->json([
                    'success' => false,
                    'message' => $errorText
                ], 400);
            }

            return response()->json([
                'success' => false,
                'message' => 'Error de base de datos: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // =========================
    // DETALLE (INERTIA PAGE)
    // =========================
public function detalle($id)
{
    $grupo = DB::table('cup.v_grupo_base')
        ->where('id_grupo', $id)
        ->first();

    $estudiantes = DB::table('cup.v_grupo_estudiantes')
        ->where('id_grupo', $id)
        ->get();

    $docentes = DB::table('cup.v_grupo_docentes')
        ->where('id_grupo', $id)
        ->get();

    return Inertia::render('Admin/GrupoDetalle', [
        'grupo' => $grupo,
        'estudiantes' => $estudiantes,
        'docentes' => $docentes,

        'estudiantes_count' => DB::table('cup.v_grupo_estudiantes')
            ->where('id_grupo', $id)
            ->distinct('id_postulante')
            ->count('id_postulante'),

        'docentes_count' => DB::table('cup.v_grupo_docentes')
            ->where('id_grupo', $id)
            ->distinct('id_docente')
            ->count('id_docente'),
    ]);
}

    // =========================
    // ESTUDIANTES (API opcional)
    // =========================
    public function estudiantesGrupo($idGrupo)
    {
        return response()->json(
            GrupoService::obtenerEstudiantesGrupo($idGrupo)
        );
    }
}