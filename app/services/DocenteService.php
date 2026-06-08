<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DocenteService
{
    public static function listar()
    {
        return DB::table('cup.v_docentes_completo')
            ->orderBy('id_docente', 'desc')
            ->get();
    }

    public static function registrar(array $data)
    {
        $id = DB::table('cup.t_docente')->insertGetId([
            'ci' => $data['ci'],
            'nombres' => $data['nombres'],
            'apellidos' => $data['apellidos'],
            'telefono' => $data['telefono'] ?? null,
            'correo' => $data['correo'] ?? null,
        ]);

        DB::table('cup.t_requisitos_docente')->insert([
            'id_docente' => $id,
            'maestria' => $data['maestria'] ?? false,
            'diplomado_es' => $data['diplomado_es'] ?? false,
            'profesion' => $data['profesion'] ?? null,
            'fecha_registro' => now(),
        ]);

        return $id;
    }

    public static function actualizar($id, array $data)
    {
        return DB::table('cup.t_docente')
            ->where('id_docente', $id)
            ->update([
                'nombres' => $data['nombres'] ?? null,
                'apellidos' => $data['apellidos'] ?? null,
                'correo' => $data['correo'] ?? null,
                'telefono' => $data['telefono'] ?? null,
            ]);
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