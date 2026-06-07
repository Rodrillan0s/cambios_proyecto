<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Cloudinary\Api\Upload\UploadApi;

class PostulanteService
{
    private static function quitarAcentos($cadena)
    {
        $acentos = [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'Á' => 'A',
            'É' => 'E',
            'Í' => 'I',
            'Ó' => 'O',
            'Ú' => 'U',
            'ñ' => 'n',
            'Ñ' => 'N'
        ];
        return strtr($cadena, $acentos);
    }

    public static function registrarPostulanteBD(array $datos, $ip, $pathCedula, $pathBachiller)
    {
        $idPostulanteCreado = null;
        DB::transaction(function () use ($datos, $ip, $pathCedula, $pathBachiller, &$idPostulanteCreado) {
            // INSERCION EN TABLAS 
            $idPostulante = DB::table('t_postulante')->insertGetId([
                'ci' => $datos['ci'],
                'nombre' => $datos['nombre'],
                'apellidos' => $datos['apellidos'],
                'fecha_nacimiento' => $datos['fecha_nacimiento'],
                'sexo' => $datos['sexo'],
                'direccion' => $datos['direccion'],
                'telefono' => $datos['telefono'],
                'correo' => $datos['correo'],
                'ciudad' => $datos['ciudad'],
            ], 'id_postulante');

            $idPostulanteCreado = $idPostulante;
            $idRequisito = DB::table('t_requisitos_postulante')->insertGetId([
                'id_postulante' => $idPostulante,
                'codigo_bachiller' => $datos['codigo_bachiller'] ?? null,
                'fecha_bachiller' => $datos['fecha_bachiller'] ?? null,
                'nombre_colegio' => $datos['nombre_colegio'] ?? null,
                'tipo_colegio' => $datos['tipo_colegio'] ?? null,
                'turno' => $datos['turno'] ?? null,
                'id_carrera_1' => $datos['id_carrera_1'],
                'id_carrera_2' => $datos['id_carrera_2'],
                'modalidad'    => $datos['modalidad'],
                'fecha_registro' => now(),
                'libreta' => false,
                'ruta_cedula' => $pathCedula,
                'ruta_bachiller' => $pathBachiller,
            ], 'id_requisito');
            DB::table('t_saldo')->insert([
                'id_requisito' => $idRequisito,
                'saldo' => 0,
                'estado' => 'LIQUIDADO'
            ]);
            DB::table('t_pago')->insert([
                'id_postulante' => $idPostulante,
                'monto' => $datos['monto'],
                'fecha_pago' => now(),
                'metodo_pago' => $datos['metodo_pago'],
                'estado' => $datos['estado_pago'],
                'transaccion_id' => $datos['transaccion_id'] ?? null,
            ]);

            \App\Services\BitacoraService::registrar(
                'PAGOS',
                'PAGO REGISTRADO',
                "Pago realizado por: {$datos['nombre']} {$datos['apellidos']}. C.I.: {$datos['ci']}. Método: {$datos['metodo_pago']}.",
                ['IP' => $ip, 'Registro automático desde proceso de inscripción'],
                null,
                null
            );

            // GENERAR USUARIO Y CONTRASEÑA PARA EL POSTULANTE
            $primerNombre = explode(' ', trim(strtolower(self::quitarAcentos($datos['nombre']))))[0];
            $primerApellido = explode(' ', trim(strtolower(self::quitarAcentos($datos['apellidos']))))[0];
            $slugUsuario = $primerNombre . '.' . $primerApellido . substr($datos['ci'], -3);

            DB::table('t_usuario')->insert([
                'usuario' => $slugUsuario,
                'password' => bcrypt($datos['ci']),
                'nombre' => $datos['nombre'] . ' ' . $datos['apellidos'],
                'correo' => $datos['correo'],
                'estado' => true,
                'id_rol' => 3,
            ]);

            // REGISTRAR EN T_BITACORA
            \App\Services\BitacoraService::registrar(
                'POSTULANTES',
                'REGISTRO EXITOSO',
                "Inscripción procesada. C.I.: {$datos['ci']}. Método: {$datos['metodo_pago']}.",
                ['IP' => $ip, 'Usuario_Creado' => $slugUsuario],
                null,
                null
            );
        });
        return $idPostulanteCreado;
    }

    public static function crearPostulante(array $datos, $ip, $pathCedula = null, $pathBachiller = null)
    {
        return self::registrarPostulanteBD($datos, $ip, $pathCedula, $pathBachiller);
    }
    public static function listarPostulantes(array $filters = [], int $perPage = 15)
    {
        $query = DB::table('t_postulante as p')
            ->leftJoin('t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
            ->leftJoin('t_pago as pay', 'p.id_postulante', '=', 'pay.id_postulante')
            ->leftJoin('t_usuario as u', 'p.correo', '=', 'u.correo')
            ->select(
                'p.id_postulante',
                'p.ci',
                'p.nombre',
                'p.apellidos',
                'p.fecha_nacimiento',
                'p.sexo',
                'p.direccion',
                'p.telefono',
                'p.correo',
                'p.ciudad',

                'r.codigo_bachiller',
                'r.fecha_bachiller',
                'r.nombre_colegio',
                'r.tipo_colegio',
                'r.turno',
                'r.id_carrera_1',
                'r.id_carrera_2',
                'r.modalidad',
                'r.ruta_cedula',
                'r.ruta_bachiller',

                'pay.monto',
                'pay.fecha_pago',
                'pay.metodo_pago',
                'pay.estado as estado_pago',
                'pay.transaccion_id',

                'u.usuario',
                'u.estado as usuario_activo',
                'u.id_rol'
            )
            ->distinct();

        // 🔹 Filtros
        if (!empty($filters['ci'])) {
            $query->where('p.ci', $filters['ci']);
        }

        if (!empty($filters['nombre'])) {
            $q = $filters['nombre'];
            $query->where(function ($qbuilder) use ($q) {
                $qbuilder->where('p.nombre', 'ilike', "%{$q}%")
                    ->orWhere('p.apellidos', 'ilike', "%{$q}%");
            });
        }

        if (!empty($filters['carrera'])) {
            $query->where(function ($qbuilder) use ($filters) {
                $qbuilder->where('r.id_carrera_1', $filters['carrera'])
                    ->orWhere('r.id_carrera_2', $filters['carrera']);
            });
        }

        if (!empty($filters['estado_pago'])) {
            $query->where('pay.estado', $filters['estado_pago']);
        }

        return $query->orderBy('p.id_postulante', 'desc')->paginate($perPage);
    }

    public static function actualizarPostulante(int $idPostulante, array $datos, array $files = [], string $ip = null): bool
    {
        $ok = false;

        DB::transaction(function () use ($idPostulante, $datos, $files, $ip, &$ok) {
            // 1) Obtener rutas actuales
            $requisito = DB::table('t_requisitos_postulante')->where('id_postulante', $idPostulante)->first();

            // 2) Actualizar t_postulante
            DB::table('t_postulante')->where('id_postulante', $idPostulante)->update([
                'nombre' => $datos['nombre'] ?? DB::raw('nombre'),
                'apellidos' => $datos['apellidos'] ?? DB::raw('apellidos'),
                'direccion' => $datos['direccion'] ?? DB::raw('direccion'),
                'telefono' => $datos['telefono'] ?? DB::raw('telefono'),
                'correo' => $datos['correo'] ?? DB::raw('correo'),
                'ciudad' => $datos['ciudad'] ?? DB::raw('ciudad'),
            ]);

            $rutaCedula = $requisito->ruta_cedula ?? null;
            $rutaBachiller = $requisito->ruta_bachiller ?? null;

            if (!empty($files['cedula'])) {
                $upload = (new UploadApi())->upload(
                    $files['cedula']->getRealPath(),
                    [
                        'folder' => "postulantes/{$datos['ci']}",
                        'public_id' => 'cedula_' . time(),
                        'resource_type' => 'auto',
                    ]
                );
                $rutaCedula = $upload['secure_url']; // 🔹 Guardar URL segura
            }

            if (!empty($files['bachiller'])) {
                $upload = (new UploadApi())->upload(
                    $files['bachiller']->getRealPath(),
                    [
                        'folder' => "postulantes/{$datos['ci']}",
                        'public_id' => 'bachiller_' . time(),
                        'resource_type' => 'auto',
                    ]
                );
                $rutaBachiller = $upload['secure_url']; // 🔹 Guardar URL segura
            }

            // 4) Actualizar t_requisitos_postulante
            DB::table('t_requisitos_postulante')->where('id_postulante', $idPostulante)->update([
                'codigo_bachiller' => $datos['codigo_bachiller'] ?? DB::raw('codigo_bachiller'),
                'fecha_bachiller' => $datos['fecha_bachiller'] ?? DB::raw('fecha_bachiller'),
                'nombre_colegio' => $datos['nombre_colegio'] ?? DB::raw('nombre_colegio'),
                'tipo_colegio' => $datos['tipo_colegio'] ?? DB::raw('tipo_colegio'),
                'turno' => $datos['turno'] ?? DB::raw('turno'),
                'ruta_cedula' => $rutaCedula,
                'ruta_bachiller' => $rutaBachiller,
            ]);

            \App\Services\BitacoraService::registrar(
                'POSTULANTES',
                'ACTUALIZACIÓN',
                "Postulante actualizado. ID: {$idPostulante}",
                ['IP' => $ip],
                null,
                null
            );

            $ok = true;
        });

        return $ok;
    }

    public static function eliminarPostulante(int $idPostulante, string $ci, string $ip = null): bool
    {
        $ok = false;

        DB::transaction(function () use ($idPostulante, $ci, $ip, &$ok) {
            $dir = "postulantes/{$ci}";
            if (Storage::exists($dir)) {
                Storage::deleteDirectory($dir);
            }

            DB::table('t_saldo')->whereIn('id_requisito', function ($q) use ($idPostulante) {
                $q->select('id_requisito')->from('t_requisitos_postulante')->where('id_postulante', $idPostulante);
            })->delete();
            DB::table('t_pago')->where('id_postulante', $idPostulante)->delete();
            DB::table('t_requisitos_postulante')->where('id_postulante', $idPostulante)->delete();
            $post = DB::table('t_postulante')->where('id_postulante', $idPostulante)->first();

            if ($post) {
                $usuario = DB::table('t_usuario')->where('correo', $post->correo)->first();

                if ($usuario) {
                    DB::table('t_sesiones')->where('id_usuario', $usuario->id_usuario)->delete();
                    DB::table('t_bitacora')->where('id_usuario', $usuario->id_usuario)->update([
                        'id_usuario' => null
                    ]);
                    DB::table('t_usuario')->where('id_usuario', $usuario->id_usuario)->delete();
                }
                DB::table('t_postulante')->where('id_postulante', $idPostulante)->delete();
                \App\Services\BitacoraService::registrar(
                    'POSTULANTES',
                    'ELIMINACIÓN',
                    "Postulante eliminado: {$post->nombre} {$post->apellidos} (C.I.: {$ci}, ID: {$idPostulante})",
                    ['IP' => $ip],
                    null,
                    null
                );
            }

            $ok = true;
        });

        return $ok;
    }


    public static function importarDesdeCSV($file, $ip)
    {
        $rows = Excel::toArray([], $file)[0];
        if (empty($rows)) {
            throw new \Exception("El archivo está vacío");
        }

        $header = array_map(fn($h) => strtolower(trim($h)), $rows[0]);
        unset($rows[0]);

        $registrados = 0;
        $duplicados = 0;
        $errores = [];

        foreach ($rows as $i => $row) {
            if (empty(array_filter($row))) continue;
            if (count($header) !== count($row)) {
                $errores[] = "Fila " . ($i + 2) . " omitida: columnas no cuadran.";
                continue;
            }

            $fila = array_combine($header, $row);
            $ci = trim($fila['ci'] ?? '');

            if (empty($ci)) {
                $errores[] = "Fila " . ($i + 2) . " omitida: No se encontró el C.I.";
                continue;
            }

            if (DB::table('t_postulante')->where('ci', $ci)->exists()) {
                $duplicados++;
                $errores[] = "Fila " . ($i + 2) . " omitida: El C.I. $ci ya está registrado.";
                continue;
            }
            $datos = self::prepararDatosFila($fila);

            try {
                self::registrarPostulanteBD($datos, $ip, null, null);
                $registrados++;
            } catch (\Exception $e) {
                $errores[] = "Fila " . ($i + 2) . " (C.I. $ci) falló: " . $e->getMessage();
            }
        }

        return [
            'registrados' => $registrados,
            'duplicados' => $duplicados,
            'errores' => $errores,
        ];
    }

    private static function prepararDatosFila(array $fila): array
    {
        $fechaNacimiento = self::convertirFecha($fila['fecha_nacimiento'] ?? null, '2000-01-01');
        $fechaBachiller = self::convertirFecha($fila['fecha_bachiller'] ?? null, null);

        return [
            'ci' => trim($fila['ci'] ?? ''),
            'nombre' => trim($fila['nombre'] ?? 'Sin Nombre'),
            'apellidos' => trim($fila['apellidos'] ?? 'Sin Apellidos'),
            'fecha_nacimiento' => $fechaNacimiento,
            'sexo' => strtoupper(trim($fila['sexo'] ?? 'M')),
            'direccion' => trim($fila['direccion'] ?? '-'),
            'telefono' => trim($fila['telefono'] ?? '-'),
            'correo' => trim($fila['correo'] ?? '-'),
            'ciudad' => trim($fila['ciudad'] ?? 'Santa Cruz'),

            'codigo_bachiller' => trim($fila['codigo_bachiller'] ?? null),
            'fecha_bachiller' => $fechaBachiller,
            'nombre_colegio' => trim($fila['nombre_colegio'] ?? null),
            'tipo_colegio' => trim($fila['tipo_colegio'] ?? null),
            'turno' => trim($fila['turno'] ?? null),
            'id_carrera_1' => intval($fila['id_carrera_1'] ?? 1874),
            'id_carrera_2' => intval($fila['id_carrera_2'] ?? null),
            'modalidad' => strtoupper(trim($fila['modalidad'] ?? 'PRESENCIAL')),

            'monto' => 180.00,
            'metodo_pago' => 'CAJA_FICCT',
            'estado_pago' => 'APROBADO',
            'transaccion_id' => 'CAJA-' . strtoupper(uniqid()),
        ];
    }

    private static function convertirFecha($valor, $default)
    {
        if (is_numeric($valor)) {
            return Carbon::createFromDate(1899, 12, 30)->addDays($valor)->format('Y-m-d');
        } elseif (!empty($valor)) {
            try {
                return Carbon::parse($valor)->format('Y-m-d');
            } catch (\Exception $e) {
                return $default;
            }
        }
        return $default;
    }
}
