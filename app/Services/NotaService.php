<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;

class NotaService
{
    // =========================
    // LISTAR NOTAS
    // =========================
    public static function listar()
    {
        return DB::table('cup.t_examen as e')
            ->join('cup.t_postulante as p', 'p.id_postulante', '=', 'e.id_postulante')
            ->join('cup.t_materia as m', 'm.id_materia', '=', 'e.id_materia')
            ->select(
                'e.id_examen',
                'p.ci',
                'e.id_materia',
                DB::raw("p.nombre || ' ' || p.apellidos as postulante"),
                'm.nombre as materia',
                'e.nro_examen',
                'e.nota',
                'e.fecha_examen'
            )
            ->orderBy('e.fecha_examen', 'desc')
            ->get();
    }

    // =========================
    // MATERIAS
    // =========================
    public static function materias()
    {
        return DB::table('cup.t_materia')
            ->select('id_materia', 'nombre')
            ->orderBy('nombre')
            ->get();
    }

    // =========================
    // BUSCAR POSTULANTE
    // =========================
    public static function buscarPostulantePorCI($ci)
    {
        return DB::table('cup.t_postulante')
            ->where('ci', $ci)
            ->first();
    }

    // =========================
    // REGISTRAR NOTA
    // =========================
    public static function registrar(array $data)
    {
        $postulante = self::buscarPostulantePorCI($data['ci']);

        if (!$postulante) {
            throw new \Exception("Postulante no encontrado");
        }
        $existe = DB::table('cup.t_examen')
    ->where('id_postulante', $postulante->id_postulante)
    ->where('id_materia', $data['id_materia'])
    ->where('nro_examen', $data['nro_examen'])
    ->exists();

if ($existe) {
    throw new \Exception("Ya existe este examen para este postulante");
}

        return DB::table('cup.t_examen')->insert([
            'id_postulante' => $postulante->id_postulante,
            'id_materia'    => $data['id_materia'],
            'nro_examen'    => $data['nro_examen'],
            'nota'          => $data['nota'],
            'fecha_examen'  => $data['fecha_examen'] ?? now(),
        ]);
    }

    // =========================
    // ACTUALIZAR
    // =========================
    public static function actualizar($id, array $data)
    {
        return DB::table('cup.t_examen')
            ->where('id_examen', $id)
            ->update([
                'id_materia'   => $data['id_materia'],
                'nro_examen'   => $data['nro_examen'],
                'nota'         => $data['nota'],
                'fecha_examen' => $data['fecha_examen']
            ]);
    }

    // =========================
    // ELIMINAR
    // =========================
    public static function eliminar($id)
    {
        return DB::table('cup.t_examen')
            ->where('id_examen', $id)
            ->delete();
    }

    // =========================
    // IMPORTAR EXCEL (FIX REAL)
    // =========================
    public static function importarExcel($file)
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $rows = $spreadsheet->getActiveSheet()->toArray();

        foreach ($rows as $i => $row) {

            if ($i === 0) continue;

            $ci      = $row[0] ?? null;
            $materia = $row[1] ?? null;
            $nro     = $row[2] ?? null;
            $nota    = $row[3] ?? null;
            $fecha   = $row[4] ?? null;

            if (!$ci || !$materia) continue;

            // =========================
            // FECHA FLEXIBLE
            // =========================
            if ($fecha) {
                try {
                    $fecha = Carbon::createFromFormat('d/m/Y', $fecha)
                        ->format('Y-m-d');
                } catch (\Exception $e) {
                    $fecha = Carbon::parse($fecha)->format('Y-m-d');
                }
            } else {
                $fecha = now();
            }

            $postulante = self::buscarPostulantePorCI($ci);
            if (!$postulante) continue;

            $materiaDB = DB::table('cup.t_materia')
                ->where('nombre', $materia)
                ->first();

            if (!$materiaDB) continue;
            
            $existe = DB::table('cup.t_examen')
    ->where('id_postulante', $postulante->id_postulante)
    ->where('id_materia', $materiaDB->id_materia)
    ->where('nro_examen', $nro)
    ->exists();

if ($existe) continue;
            DB::table('cup.t_examen')->insert([
                'id_postulante' => $postulante->id_postulante,
                'id_materia'    => $materiaDB->id_materia,
                'nro_examen'    => $nro,
                'nota'          => $nota,
                'fecha_examen'  => $fecha
            ]);
        }
    }
}