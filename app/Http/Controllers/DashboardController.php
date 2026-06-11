<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\ReporteService;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Renderiza el Dashboard principal adaptado al rol del usuario.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $rol = $user->id_rol; // 1: ADMINISTRADOR, 2: DOCENTE, 3: POSTULANTE, 4: AUTORIDAD, 5: COORDINADOR

        $data = [
            'rol' => $rol,
            'user' => $user
        ];

        // ==========================================
        // 1. VISTA DE POSTULANTE (Estudiante)
        // ==========================================
        if ($rol == 3) {
            // Buscar postulante asociado al correo o usuario
            $postulante = DB::table('cup.t_postulante')->where('correo', $user->correo)->first();
            if (!$postulante) {
                $postulante = DB::table('cup.t_postulante')->where('ci', $user->usuario)->first();
            }

            if ($postulante) {
                // Obtener exámenes y calificaciones de este postulante
                $examenes = DB::table('cup.t_examen as e')
                    ->join('cup.t_materia as m', 'e.id_materia', '=', 'm.id_materia')
                    ->where('e.id_postulante', $postulante->id_postulante)
                    ->select('m.nombre as materia', 'e.nro_examen', 'e.nota', 'e.fecha_examen')
                    ->orderBy('m.nombre')
                    ->orderBy('e.nro_examen')
                    ->get();
                
                $data['postulante'] = $postulante;
                $data['examenes'] = $examenes;
            } else {
                $data['examenes'] = [];
            }
        }
        
        // ==========================================
        // 2. VISTA DE DOCENTE
        // ==========================================
        else if ($rol == 2) {
            // Buscar docente asociado al correo o usuario
            $docente = DB::table('cup.t_docente')->where('correo', $user->correo)->first();
            if (!$docente) {
                $docente = DB::table('cup.t_docente')->where('ci', $user->usuario)->first();
            }

            if ($docente) {
                // Obtener materias, grupos y horarios asignados
                $asignaciones = DB::table('cup.t_asignacion_docente as ad')
                    ->join('cup.t_grupo as g', 'ad.id_grupo', '=', 'g.id_grupo')
                    ->join('cup.t_materia as m', 'ad.id_materia', '=', 'm.id_materia')
                    ->leftJoin('cup.v_horarios_grupo as h', function($join) {
                        $join->on('ad.id_grupo', '=', 'h.id_grupo')
                             ->on('ad.id_materia', '=', 'h.id_materia')
                             ->on('ad.id_docente', '=', 'h.id_docente');
                    })
                    ->where('ad.id_docente', $docente->id_docente)
                    ->select(
                        'ad.id_grupo',
                        'g.nombre as grupo',
                        'ad.id_materia',
                        'm.nombre as materia',
                        'g.id_turno',
                        'h.dia_semana',
                        'h.hora_inicio',
                        'h.hora_fin'
                    )
                    ->get();

                // Obtener el día actual en español y la fecha en formato YYYY-MM-DD
                $hoyNombre = strtolower(Carbon::today()->locale('es')->dayName);
                $hoyFechaStr = Carbon::today()->format('Y-m-d');

                // Verificar cuál de estas materias tiene asistencia marcada hoy
                foreach ($asignaciones as $asig) {
                    $marcado = DB::table('cup.t_asistencia_docente')
                        ->where('id_docente', $docente->id_docente)
                        ->where('id_grupo', $asig->id_grupo)
                        ->where('id_materia', $asig->id_materia)
                        ->whereDate('fecha_asistencia', $hoyFechaStr)
                        ->first();

                    $asig->asistencia_hoy = $marcado ? ($marcado->tiene_asistencia ? 'ASISTIO' : 'FALTO') : 'PENDIENTE';
                }

                // Obtener el historial de sus últimas 20 asistencias marcadas
                $asistencias = DB::table('cup.t_asistencia_docente as a')
                    ->join('cup.t_grupo as g', 'a.id_grupo', '=', 'g.id_grupo')
                    ->join('cup.t_materia as m', 'a.id_materia', '=', 'm.id_materia')
                    ->where('a.id_docente', $docente->id_docente)
                    ->select('a.fecha_asistencia as fecha', 'a.tiene_asistencia', 'g.nombre as grupo', 'm.nombre as materia')
                    ->orderBy('a.fecha_asistencia', 'desc')
                    ->limit(20)
                    ->get();

                $data['docente'] = $docente;
                $data['asignaciones'] = $asignaciones;
                $data['asistencias'] = $asistencias;
                $data['hoyDia'] = $hoyNombre;
                $data['hoyFecha'] = $hoyFechaStr;
            } else {
                $data['asignaciones'] = [];
                $data['asistencias'] = [];
            }
        }

        // ==========================================
        // 3. VISTA DE ADMINISTRADOR / COORDINADOR / AUTORIDAD
        // ==========================================
        else {
            $gestiones = ReporteService::obtenerGestiones();
            $selectedGestion = $request->get('gestion', $gestiones[0] ?? '');

            $postulantesCount = 0;
            $aprobadosCount = 0;
            $reprobadosCount = 0;
            $ingresosTotal = 0;

            if ($selectedGestion) {
                list($start, $end) = ReporteService::obtenerRangoFechasGestion($selectedGestion);

                // Cantidad total de postulantes registrados
                $postulantesCount = DB::table('cup.t_requisitos_postulante')
                    ->where('fecha_registro', '>=', $start)
                    ->where('fecha_registro', '<', $end)
                    ->count();

                // Cantidad de aprobados/reprobados en base al promedio final
                $desempeno = DB::table('cup.v_desempeno_postulante')
                    ->where('gestion', $selectedGestion)
                    ->select(
                        DB::raw('COUNT(*) as total'),
                        DB::raw('SUM(CASE WHEN aprobado = true THEN 1 ELSE 0 END) as aprobados'),
                        DB::raw('SUM(CASE WHEN aprobado = false THEN 1 ELSE 0 END) as reprobados')
                    )
                    ->first();

                if ($desempeno) {
                    $aprobadosCount = $desempeno->aprobados ?? 0;
                    $reprobadosCount = $desempeno->reprobados ?? 0;
                }

                // Total ingresos recaudados en este periodo
                $ingresosTotal = DB::table('cup.t_pago as p')
                    ->join('cup.t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
                    ->where('p.estado', 'APROBADO')
                    ->where('r.fecha_registro', '>=', $start)
                    ->where('r.fecha_registro', '<', $end)
                    ->sum('p.monto');
            }

            // Distribución de postulantes por carrera
            $carrerasData = [];
            if ($selectedGestion) {
                list($start, $end) = ReporteService::obtenerRangoFechasGestion($selectedGestion);
                $carrerasData = DB::table('cup.t_requisitos_postulante as r')
                    ->join('cup.t_carrera as c', 'r.id_carrera_1', '=', 'c.id_carrera')
                    ->where('r.fecha_registro', '>=', $start)
                    ->where('r.fecha_registro', '<', $end)
                    ->select('c.nombre as carrera', DB::raw('COUNT(*) as total'))
                    ->groupBy('c.nombre')
                    ->get();
            }

            $data['gestiones'] = $gestiones;
            $data['selectedGestion'] = $selectedGestion;
            $data['stats'] = [
                'postulantes' => $postulantesCount,
                'aprobados' => $aprobadosCount,
                'reprobados' => $reprobadosCount,
                'ingresos' => floatval($ingresosTotal)
            ];
            $data['carrerasData'] = $carrerasData;
        }

        return Inertia::render('Dashboard', $data);
    }
}
