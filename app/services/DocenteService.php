<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DocenteService
{
    public static function listar()
    {
        $docentes = DB::table('cup.v_docentes_completo')
            ->orderBy('id_docente', 'desc')
            ->get();

        $asignaciones = DB::table('cup.t_asignacion_docente as ad')
            ->join('cup.t_materia as m', 'ad.id_materia', '=', 'm.id_materia')
            ->join('cup.t_grupo as g', 'ad.id_grupo', '=', 'g.id_grupo')
            ->select('ad.id_docente', 'ad.id_grupo', 'g.nombre as grupo', 'ad.id_materia', 'm.nombre as materia')
            ->get()
            ->groupBy('id_docente');

        foreach ($docentes as $d) {
            $d->materias = $asignaciones->has($d->id_docente) 
                ? $asignaciones->get($d->id_docente)->all() 
                : [];
        }

        return $docentes;
    }

    public static function registrar(array $data)
    {
        $id = DB::table('cup.t_docente')->insertGetId([
            'ci' => $data['ci'],
            'nombres' => $data['nombres'],
            'apellidos' => $data['apellidos'],
            'telefono' => $data['telefono'] ?? null,
            'correo' => $data['correo'] ?? null,
        ], 'id_docente');

        DB::table('cup.t_requisitos_docente')->insert([
            'id_docente' => $id,
            'maestria' => isset($data['maestria']) ? (bool)$data['maestria'] : false,
            'diplomado_es' => isset($data['diplomado_es']) ? (bool)$data['diplomado_es'] : false,
            'profesion' => $data['profesion'] ?? null,
            'fecha_registro' => now(),
        ]);

        return $id;
    }

    public static function actualizar($id, array $data)
    {
        DB::transaction(function() use ($id, $data) {
            DB::table('cup.t_docente')
                ->where('id_docente', $id)
                ->update([
                    'ci' => $data['ci'] ?? null,
                    'nombres' => $data['nombres'] ?? null,
                    'apellidos' => $data['apellidos'] ?? null,
                    'correo' => $data['correo'] ?? null,
                    'telefono' => $data['telefono'] ?? null,
                ]);

            DB::table('cup.t_requisitos_docente')
                ->updateOrInsert(
                    ['id_docente' => $id],
                    [
                        'maestria' => isset($data['maestria']) ? (bool)$data['maestria'] : false,
                        'diplomado_es' => isset($data['diplomado_es']) ? (bool)$data['diplomado_es'] : false,
                        'profesion' => $data['profesion'] ?? null,
                    ]
                );
        });

        return ['ok' => true, 'msg' => 'Docente actualizado correctamente'];
    }

    public static function eliminar($id)
    {
        DB::transaction(function() use ($id) {
            DB::table('cup.t_requisitos_docente')->where('id_docente', $id)->delete();
            DB::table('cup.t_asignacion_docente')->where('id_docente', $id)->delete();
            DB::table('cup.t_asistencia_docente')->where('id_docente', $id)->delete();
            DB::table('cup.t_licencia_docente')->where('id_docente', $id)->delete();
            DB::table('cup.t_docente')->where('id_docente', $id)->delete();
        });

        return ['ok' => true, 'msg' => 'Docente eliminado correctamente'];
    }

    public static function asignarMateria($data)
    {
        DB::table('cup.t_asignacion_docente')->insert([
            'id_docente' => $data['id_docente'],
            'id_grupo' => $data['id_grupo'],
            'id_materia' => $data['id_materia'],
        ]);

        return ['ok' => true, 'msg' => 'Materia asignada'];
    }

    public static function quitarMateria($id_docente, $id_grupo, $id_materia)
    {
        DB::table('cup.t_asignacion_docente')
            ->where(compact('id_docente','id_grupo','id_materia'))
            ->delete();

        return ['ok' => true, 'msg' => 'Materia eliminada'];
    }
}