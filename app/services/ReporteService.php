<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReporteService
{
    /**
     * Obtiene el rango de fechas para una gestión en formato YYYYPP (ej. 202601, 202502)
     */
    public static function obtenerRangoFechasGestion($gestion)
    {
        $anio = intval(substr($gestion, 0, 4));
        $periodo = intval(substr($gestion, 4, 2));
        if ($periodo === 1) {
            $fechaInicio = "{$anio}-01-01 00:00:00";
            $fechaFin = "{$anio}-07-01 00:00:00";
        } else {
            $fechaInicio = "{$anio}-07-01 00:00:00";
            $fechaFin = ($anio + 1) . "-01-01 00:00:00";
        }
        return [$fechaInicio, $fechaFin];
    }

    /**
     * Obtiene la lista de gestiones registradas y calculadas en el sistema.
     */
    public static function obtenerGestiones()
    {
        $gestionesGrupo = DB::table('cup.t_grupo')
            ->distinct()
            ->pluck('gestion')
            ->filter()
            ->toArray();

        $years = DB::table('cup.t_requisitos_postulante')
            ->selectRaw('DISTINCT EXTRACT(YEAR FROM fecha_registro) as anio')
            ->pluck('anio')
            ->filter()
            ->toArray();

        $gestionesCalculadas = [];
        foreach ($years as $y) {
            $gestionesCalculadas[] = "{$y}01";
            $gestionesCalculadas[] = "{$y}02";
        }

        $all = array_unique(array_merge($gestionesGrupo, $gestionesCalculadas));
        sort($all);
        return array_values(array_reverse($all));
    }

    /**
     * 1. Docentes con más faltas
     */
    public static function docentesMasFaltas($gestion)
    {
        $query = DB::table('cup.t_asistencia_docente as a')
            ->join('cup.t_docente as d', 'a.id_docente', '=', 'd.id_docente')
            ->join('cup.t_grupo as g', 'a.id_grupo', '=', 'g.id_grupo')
            ->select(
                'd.id_docente',
                'd.ci',
                'd.nombres',
                'd.apellidos',
                DB::raw('COUNT(a.id_asistencia) as total_clases'),
                DB::raw('SUM(CASE WHEN NOT a.tiene_asistencia THEN 1 ELSE 0 END) as faltas')
            )
            ->whereRaw('a.tiene_asistencia = false');

        if ($gestion) {
            $query->where('g.gestion', $gestion);
        }

        return $query->groupBy('d.id_docente', 'd.ci', 'd.nombres', 'd.apellidos')
            ->orderBy('faltas', 'desc')
            ->get();
    }

    /**
     * 2. Docentes con asistencia perfecta u óptima (>= 95%)
     */
    public static function docentesAsistenciaPerfecta($gestion)
    {
        $query = DB::table('cup.t_asistencia_docente as a')
            ->join('cup.t_docente as d', 'a.id_docente', '=', 'd.id_docente')
            ->join('cup.t_grupo as g', 'a.id_grupo', '=', 'g.id_grupo')
            ->select(
                'd.id_docente',
                'd.ci',
                'd.nombres',
                'd.apellidos',
                DB::raw('COUNT(a.id_asistencia) as total_clases'),
                DB::raw('SUM(CASE WHEN a.tiene_asistencia THEN 1 ELSE 0 END) as asistencias'),
                DB::raw('ROUND(SUM(CASE WHEN a.tiene_asistencia THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id_asistencia), 2) as porcentaje')
            );

        if ($gestion) {
            $query->where('g.gestion', $gestion);
        }

        return $query->groupBy('d.id_docente', 'd.ci', 'd.nombres', 'd.apellidos')
            ->havingRaw('COUNT(a.id_asistencia) > 0')
            ->havingRaw('ROUND(SUM(CASE WHEN a.tiene_asistencia THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id_asistencia), 2) >= 95.0')
            ->orderBy('porcentaje', 'desc')
            ->orderBy('total_clases', 'desc')
            ->get();
    }

    /**
     * 3. Total ingresos por gestión
     */
    public static function ingresosPorGestion()
    {
        return DB::table('cup.t_pago as p')
            ->join('cup.t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
            ->select(
                DB::raw("(EXTRACT(YEAR FROM r.fecha_registro) || CASE WHEN EXTRACT(MONTH FROM r.fecha_registro) <= 6 THEN '01' ELSE '02' END) as gestion"),
                DB::raw('COUNT(p.id_pago) as total_pagos'),
                DB::raw('SUM(p.monto) as total_ingresos')
            )
            ->where('p.estado', 'APROBADO')
            ->groupBy('gestion')
            ->orderBy('gestion', 'desc')
            ->get();
    }

    /**
     * 4. Total ingresos por carrera
     */
    public static function ingresosPorCarrera($gestion)
    {
        $query = DB::table('cup.t_pago as p')
            ->join('cup.t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
            ->join('cup.t_carrera as c', 'r.id_carrera_1', '=', 'c.id_carrera')
            ->select(
                'c.id_carrera',
                'c.nombre as carrera',
                DB::raw('COUNT(p.id_pago) as total_pagos'),
                DB::raw('SUM(p.monto) as total_ingresos')
            )
            ->where('p.estado', 'APROBADO');

        if ($gestion) {
            list($start, $end) = self::obtenerRangoFechasGestion($gestion);
            $query->where('r.fecha_registro', '>=', $start)
                  ->where('r.fecha_registro', '<', $end);
        }

        return $query->groupBy('c.id_carrera', 'c.nombre')
            ->orderBy('total_ingresos', 'desc')
            ->get();
    }

    /**
     * 5. Docentes con mayor índice de aprobados (tasa de aprobación de alumnos)
     */
    public static function docentesMayorIndiceAprobados($gestion)
    {
        $query = DB::table('cup.t_asignacion_docente as ad')
            ->join('cup.t_docente as d', 'ad.id_docente', '=', 'd.id_docente')
            ->join('cup.v_desempeno_postulante as dp', 'ad.id_grupo', '=', 'dp.id_grupo')
            ->select(
                'd.id_docente',
                'd.ci',
                'd.nombres',
                'd.apellidos',
                DB::raw('COUNT(DISTINCT dp.id_postulante) as total_estudiantes'),
                DB::raw('SUM(CASE WHEN dp.aprobado = true THEN 1 ELSE 0 END) as aprobados'),
                DB::raw('ROUND(SUM(CASE WHEN dp.aprobado = true THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT dp.id_postulante), 2) as tasa_aprobacion')
            );

        if ($gestion) {
            $query->where('dp.gestion', $gestion);
        }

        return $query->groupBy('d.id_docente', 'd.ci', 'd.nombres', 'd.apellidos')
            ->havingRaw('COUNT(DISTINCT dp.id_postulante) > 0')
            ->orderBy('tasa_aprobacion', 'desc')
            ->get();
    }

    /**
     * 6. Materia con más índice de reprobados
     */
    public static function materiaMasIndiceReprobados($gestion)
    {
        $baseQuery = DB::table('cup.v_desempeno_postulante');
        if ($gestion) {
            $baseQuery->where('gestion', $gestion);
        }

        $postulantes = $baseQuery->get();

        $materias = [
            'Matemáticas' => 'promedio_matematicas',
            'Física' => 'promedio_fisica',
            'Computación' => 'promedio_computacion',
            'Inglés' => 'promedio_ingles'
        ];

        $resultados = [];
        foreach ($materias as $nombre => $col) {
            $total = 0;
            $reprobados = 0;
            $acumulado = 0;

            foreach ($postulantes as $p) {
                if ($p->$col !== null) {
                    $total++;
                    $score = floatval($p->$col);
                    $acumulado += $score;
                    if ($score < 51) {
                        $reprobados++;
                    }
                }
            }

            $tasaReprobados = $total > 0 ? round(($reprobados * 100.0) / $total, 2) : 0;
            $promedio = $total > 0 ? round($acumulado / $total, 2) : 0;

            $resultados[] = (object)[
                'materia' => $nombre,
                'total_alumnos' => $total,
                'reprobados' => $reprobados,
                'tasa_reprobados' => $tasaReprobados,
                'promedio_nota' => $promedio
            ];
        }

        usort($resultados, function ($a, $b) {
            return $b->tasa_reprobados <=> $a->tasa_reprobados;
        });

        return $resultados;
    }

    /**
     * 7. Ver postulantes concurrentes (hayan postulado en anteriores CUP)
     */
    public static function postulantesConcurrentes()
    {
        return DB::table('cup.t_postulante as p')
            ->join('cup.t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
            ->select(
                'p.id_postulante',
                'p.ci',
                'p.nombre',
                'p.apellidos',
                'p.correo',
                'p.telefono',
                DB::raw('COUNT(r.id_requisito) as postulaciones'),
                DB::raw("STRING_AGG(DISTINCT (EXTRACT(YEAR FROM r.fecha_registro) || CASE WHEN EXTRACT(MONTH FROM r.fecha_registro) <= 6 THEN '01' ELSE '02' END), ', ') as gestiones")
            )
            ->groupBy('p.id_postulante', 'p.ci', 'p.nombre', 'p.apellidos', 'p.correo', 'p.telefono')
            ->havingRaw('COUNT(r.id_requisito) > 1')
            ->orderBy('postulaciones', 'desc')
            ->get();
    }

    /**
     * 8. Lista general de postulantes
     */
    public static function listaGeneralPostulantes($gestion)
    {
        $query = DB::table('cup.t_postulante as p')
            ->join('cup.t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
            ->join('cup.t_carrera as c1', 'r.id_carrera_1', '=', 'c1.id_carrera')
            ->join('cup.t_carrera as c2', 'r.id_carrera_2', '=', 'c2.id_carrera')
            ->leftJoin('cup.t_pago as pay', 'p.id_postulante', '=', 'pay.id_postulante')
            ->select(
                'p.id_postulante',
                'p.ci',
                'p.nombre',
                'p.apellidos',
                'p.correo',
                'p.telefono',
                'r.fecha_registro',
                'c1.nombre as carrera_1',
                'c2.nombre as carrera_2',
                'pay.monto as monto_pago',
                'pay.estado as estado_pago'
            );

        if ($gestion) {
            list($start, $end) = self::obtenerRangoFechasGestion($gestion);
            $query->where('r.fecha_registro', '>=', $start)
                  ->where('r.fecha_registro', '<', $end);
        }

        return $query->orderBy('r.fecha_registro', 'desc')->get();
    }

    /**
     * 9. Postulantes aprobados
     */
    public static function postulantesAprobados($gestion)
    {
        $query = DB::table('cup.v_desempeno_postulante')
            ->select(
                'id_postulante',
                'ci',
                'postulante',
                'promedio_matematicas',
                'promedio_fisica',
                'promedio_computacion',
                'promedio_ingles',
                'promedio_final',
                'nombre_grupo',
                'carrera as carrera_admitido'
            )
            ->where('aprobado', true);

        if ($gestion) {
            $query->where('gestion', $gestion);
        }

        return $query->orderBy('promedio_final', 'desc')->get();
    }

    /**
     * 10. Postulantes reprobados
     */
    public static function postulantesReprobados($gestion)
    {
        $query = DB::table('cup.v_desempeno_postulante')
            ->select(
                'id_postulante',
                'ci',
                'postulante',
                'promedio_matematicas',
                'promedio_fisica',
                'promedio_computacion',
                'promedio_ingles',
                'promedio_final',
                'nombre_grupo'
            )
            ->where(function ($q) {
                $q->where('aprobado', false)->orWhereNull('aprobado');
            });

        if ($gestion) {
            $query->where('gestion', $gestion);
        }

        return $query->orderBy('promedio_final', 'desc')->get();
    }

    /**
     * 11. Promedios generales
     */
    public static function promediosGenerales($gestion)
    {
        $query = DB::table('cup.v_desempeno_postulante')
            ->select(
                DB::raw('ROUND(AVG(promedio_matematicas), 2) as avg_matematicas'),
                DB::raw('ROUND(AVG(promedio_fisica), 2) as avg_fisica'),
                DB::raw('ROUND(AVG(promedio_computacion), 2) as avg_computacion'),
                DB::raw('ROUND(AVG(promedio_ingles), 2) as avg_ingles'),
                DB::raw('ROUND(AVG(promedio_final), 2) as avg_final'),
                DB::raw('COUNT(id_postulante) as total_postulantes')
            );

        if ($gestion) {
            $query->where('gestion', $gestion);
        }

        return $query->get();
    }

    /**
     * 12. Cantidad de grupos habilitados
     */
    public static function cantidadGruposHabilitados($gestion)
    {
        $query = DB::table('cup.t_grupo as g')
            ->leftJoin('cup.t_turno as t', 'g.id_turno', '=', 't.id_turno')
            ->select(
                'g.id_grupo',
                'g.nombre as nombre_grupo',
                'g.capacidad',
                't.turno as turno',
                DB::raw('(SELECT COUNT(*) FROM cup.t_postulante_grupo pg WHERE pg.id_grupo = g.id_grupo) as total_postulantes')
            );

        if ($gestion) {
            $query->where('g.gestion', $gestion);
        }

        return $query->orderBy('g.nombre')->get();
    }

    /**
     * 13. Estadísticas por materia (Aprobados, Reprobados, Promedio)
     */
    public static function estadisticasPorMateria($gestion)
    {
        return self::materiaMasIndiceReprobados($gestion);
    }

    /**
     * 14. Docentes por grupos
     */
    public static function docentesPorGrupo($gestion)
    {
        $query = DB::table('cup.t_grupo as g')
            ->join('cup.t_asignacion_docente as ad', 'g.id_grupo', '=', 'ad.id_grupo')
            ->join('cup.t_docente as d', 'ad.id_docente', '=', 'd.id_docente')
            ->join('cup.t_materia as m', 'ad.id_materia', '=', 'm.id_materia')
            ->select(
                'g.nombre as nombre_grupo',
                'g.gestion',
                'd.ci as ci_docente',
                DB::raw("d.nombres || ' ' || d.apellidos as docente"),
                'm.nombre as materia'
            );

        if ($gestion) {
            $query->where('g.gestion', $gestion);
        }

        return $query->orderBy('g.nombre')->orderBy('m.nombre')->get();
    }

    /**
     * 15. Grupos con mayor cantidad de aprobados
     */
    public static function gruposMasAprobados($gestion)
    {
        $query = DB::table('cup.t_grupo as g')
            ->leftJoin('cup.v_desempeno_postulante as dp', 'g.id_grupo', '=', 'dp.id_grupo')
            ->select(
                'g.id_grupo',
                'g.nombre as nombre_grupo',
                DB::raw('COUNT(dp.id_postulante) as total_estudiantes'),
                DB::raw('SUM(CASE WHEN dp.aprobado = true THEN 1 ELSE 0 END) as aprobados'),
                DB::raw('ROUND(SUM(CASE WHEN dp.aprobado = true THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(dp.id_postulante), 0), 2) as tasa_aprobados')
            );

        if ($gestion) {
            $query->where('g.gestion', $gestion);
        }

        return $query->groupBy('g.id_grupo', 'g.nombre')
            ->orderBy('aprobados', 'desc')
            ->get();
    }
}
