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

    public static function registrarPostulanteBD(array $datos, $ip, $pathCedula, $pathBachiller, $esImportacion = false, $existingPostulantes = null, $existingUsers = null)
    {
        $idPostulanteCreado = null;
        DB::transaction(function () use ($datos, $ip, $pathCedula, $pathBachiller, &$idPostulanteCreado, $esImportacion, $existingPostulantes, $existingUsers) {
            // INSERCION O ACTUALIZACION EN TABLAS (SOPORTE MULTI-GESTION)
            if (is_array($existingPostulantes)) {
                $existente = $existingPostulantes[$datos['ci']] ?? null;
            } else {
                $existente = DB::table('t_postulante')->where('ci', $datos['ci'])->first();
            }

            if ($existente) {
                $idPostulante = $existente->id_postulante;
                DB::table('t_postulante')->where('id_postulante', $idPostulante)->update([
                    'nombre' => $datos['nombre'],
                    'apellidos' => $datos['apellidos'],
                    'fecha_nacimiento' => $datos['fecha_nacimiento'],
                    'sexo' => $datos['sexo'],
                    'direccion' => $datos['direccion'],
                    'telefono' => $datos['telefono'],
                    'correo' => $datos['correo'],
                    'ciudad' => $datos['ciudad'],
                ]);
            } else {
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
            }

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
                'fecha_registro' => $datos['fecha_registro'] ?? now(),
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
                'fecha_pago' => $datos['fecha_pago'] ?? $datos['fecha_registro'] ?? now(),
                'metodo_pago' => $datos['metodo_pago'],
                'estado' => $datos['estado_pago'],
                'transaccion_id' => $datos['transaccion_id'] ?? null,
            ]);

            if (!$esImportacion) {
                \App\Services\BitacoraService::registrar(
                    'PAGOS',
                    'PAGO REGISTRADO',
                    "Pago realizado por: {$datos['nombre']} {$datos['apellidos']}. C.I.: {$datos['ci']}. Método: {$datos['metodo_pago']}.",
                    ['IP' => $ip, 'Registro automático desde proceso de inscripción'],
                    null,
                    null
                );
            }

            // GENERAR USUARIO Y CONTRASEÑA PARA EL POSTULANTE
            $primerNombre = explode(' ', trim(strtolower(self::quitarAcentos($datos['nombre']))))[0];
            $primerApellido = explode(' ', trim(strtolower(self::quitarAcentos($datos['apellidos']))))[0];
            $slugUsuario = $primerNombre . '.' . $primerApellido . substr($datos['ci'], -3);

            if (is_array($existingUsers)) {
                $usuarioExistente = $existingUsers[$slugUsuario] ?? null;
            } else {
                $usuarioExistente = DB::table('t_usuario')->where('usuario', $slugUsuario)->first();
            }

            if (!$usuarioExistente) {
                DB::table('t_usuario')->insert([
                    'usuario' => $slugUsuario,
                    'password' => bcrypt($datos['ci']),
                    'nombre' => $datos['nombre'] . ' ' . $datos['apellidos'],
                    'correo' => $datos['correo'],
                    'estado' => true,
                    'id_rol' => 3,
                    'cambiar_password' => true,
                ]);
            } else {
                DB::table('t_usuario')->where('id_usuario', $usuarioExistente->id_usuario)->update([
                    'nombre' => $datos['nombre'] . ' ' . $datos['apellidos'],
                    'correo' => $datos['correo'],
                ]);
            }

            if (!$esImportacion) {
                // REGISTRAR EN T_BITACORA
                \App\Services\BitacoraService::registrar(
                    'POSTULANTES',
                    'REGISTRO EXITOSO',
                    "Inscripción procesada. C.I.: {$datos['ci']}. Método: {$datos['metodo_pago']}.",
                    ['IP' => $ip, 'Usuario_Creado' => $slugUsuario],
                    null,
                    null
                );
            }
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
        if (!empty($filters['gestion'])) {
            $gestion = $filters['gestion'];
            $anio = intval(substr($gestion, 0, 4));
            $periodo = intval(substr($gestion, 4, 2));
            if ($periodo === 1) {
                $fechaInicio = "{$anio}-01-01 00:00:00";
                $fechaFin = "{$anio}-07-01 00:00:00";
            } else {
                $fechaInicio = "{$anio}-07-01 00:00:00";
                $fechaFin = ($anio + 1) . "-01-01 00:00:00";
            }
            $query->where('r.fecha_registro', '>=', $fechaInicio)
                  ->where('r.fecha_registro', '<', $fechaFin);
        }

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
        @set_time_limit(300);

        $rows = Excel::toArray([], $file)[0];
        if (empty($rows)) {
            throw new \Exception("El archivo está vacío");
        }

        $header = array_map(fn($h) => strtolower(trim($h)), $rows[0]);
        unset($rows[0]);

        $registrados = 0;
        $duplicados = 0;
        $errores = [];

        // 1. Preprocesar filas para recolectar CIs y preparar datos
        $datosFilas = [];
        $cis = [];

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

            $datos = self::prepararDatosFila($fila);
            $datosFilas[$i] = [
                'ci' => $ci,
                'datos' => $datos,
                'fila_index' => $i + 2,
            ];
            $cis[] = $ci;
        }

        // 2. Pre-cargar datos desde la base de datos en lote (batch) para evitar cientos de consultas individuales por red
        $existingPostulantes = [];
        $existingRequisitos = [];
        $existingUsers = [];

        if (!empty($cis)) {
            // Cargar postulantes existentes
            $existingPostulantes = DB::table('t_postulante')
                ->whereIn('ci', $cis)
                ->get()
                ->keyBy('ci')
                ->all();

            // Cargar requisitos para verificar duplicados por gestión
            $existingRequisitos = DB::table('t_postulante as p')
                ->join('t_requisitos_postulante as r', 'p.id_postulante', '=', 'r.id_postulante')
                ->select('p.ci', 'r.fecha_registro')
                ->whereIn('p.ci', $cis)
                ->get()
                ->groupBy('ci')
                ->all();

            // Cargar usuarios para evitar recálculo de bcrypt si ya existen
            $usernames = [];
            foreach ($datosFilas as $item) {
                $datos = $item['datos'];
                $primerNombre = explode(' ', trim(strtolower(self::quitarAcentos($datos['nombre']))))[0];
                $primerApellido = explode(' ', trim(strtolower(self::quitarAcentos($datos['apellidos']))))[0];
                $slugUsuario = $primerNombre . '.' . $primerApellido . substr($datos['ci'], -3);
                $usernames[] = $slugUsuario;
            }

            if (!empty($usernames)) {
                $existingUsers = DB::table('t_usuario')
                    ->whereIn('usuario', $usernames)
                    ->get()
                    ->keyBy('usuario')
                    ->all();
            }
        }

        // Arrays para guardar datos que se insertarán en lote
        $postulanteMap = []; // ci -> id_postulante
        $requisitoMap = [];  // id_postulante -> id_requisito
        $validItems = [];    // Filas que pasaron validaciones de duplicidad

        foreach ($datosFilas as $i => $item) {
            $ci = $item['ci'];
            $datos = $item['datos'];

            // Validar existencia únicamente en la gestión correspondiente a la fecha de registro
            $fechaReg = Carbon::parse($datos['fecha_registro']);
            $year = $fechaReg->year;
            if ($fechaReg->month <= 6) {
                $start = "{$year}-01-01 00:00:00";
                $end = "{$year}-07-01 00:00:00";
            } else {
                $start = "{$year}-07-01 00:00:00";
                $end = ($year + 1) . "-01-01 00:00:00";
            }

            // Comprobar en el array pre-cargado si existe registro en la gestión del estudiante
            $existeEnGestion = false;
            if (isset($existingRequisitos[$ci])) {
                foreach ($existingRequisitos[$ci] as $req) {
                    $fechaReq = $req->fecha_registro;
                    if ($fechaReq >= $start && $fechaReq < $end) {
                        $existeEnGestion = true;
                        break;
                    }
                }
            }

            if ($existeEnGestion) {
                $duplicados++;
                $errores[] = "Fila " . $item['fila_index'] . " omitida: El C.I. $ci ya está registrado en la gestión de esa fecha de registro.";
                continue;
            }

            $validItems[] = $item;
        }

        if (empty($validItems)) {
            return [
                'registrados' => 0,
                'duplicados' => $duplicados,
                'errores' => $errores,
            ];
        }

        // Agrupar e insertar/actualizar
        DB::beginTransaction();
        try {
            // A. Preparar inserciones y actualizaciones de t_postulante
            $postulantesInsertPayload = [];
            $postulantesUpdatePayload = [];
            foreach ($validItems as $item) {
                $ci = $item['ci'];
                $datos = $item['datos'];
                $existente = $existingPostulantes[$ci] ?? null;

                if ($existente) {
                    // Si existe, lo guardamos para actualización en lote
                    $postulantesUpdatePayload[] = [
                        'id_postulante' => $existente->id_postulante,
                        'nombre' => $datos['nombre'],
                        'apellidos' => $datos['apellidos'],
                        'fecha_nacimiento' => $datos['fecha_nacimiento'],
                        'sexo' => $datos['sexo'],
                        'direccion' => $datos['direccion'],
                        'telefono' => $datos['telefono'],
                        'correo' => $datos['correo'],
                        'ciudad' => $datos['ciudad'],
                    ];
                    $postulanteMap[$ci] = $existente->id_postulante;
                } else {
                    // Si es nuevo, lo guardamos para inserción en lote
                    $postulantesInsertPayload[] = [
                        'ci' => $ci,
                        'nombre' => $datos['nombre'],
                        'apellidos' => $datos['apellidos'],
                        'fecha_nacimiento' => $datos['fecha_nacimiento'],
                        'sexo' => $datos['sexo'],
                        'direccion' => $datos['direccion'],
                        'telefono' => $datos['telefono'],
                        'correo' => $datos['correo'],
                        'ciudad' => $datos['ciudad'],
                    ];
                }
            }

            // Realizar la actualización en lote de postulantes existentes
            if (!empty($postulantesUpdatePayload)) {
                foreach (array_chunk($postulantesUpdatePayload, 100) as $chunk) {
                    $columns = ['nombre', 'apellidos', 'fecha_nacimiento', 'sexo', 'direccion', 'telefono', 'correo', 'ciudad', 'id_postulante'];
                    $placeholdersList = [];
                    $bindings = [];
                    foreach ($chunk as $row) {
                        $placeholdersList[] = '(CAST(? AS VARCHAR), CAST(? AS VARCHAR), CAST(? AS DATE), CAST(? AS VARCHAR), CAST(? AS VARCHAR), CAST(? AS VARCHAR), CAST(? AS VARCHAR), CAST(? AS VARCHAR), CAST(? AS INTEGER))';
                        foreach ($columns as $col) {
                            $bindings[] = $row[$col];
                        }
                    }
                    
                    $sql = "UPDATE t_postulante AS p 
                            SET 
                                nombre = u.nombre,
                                apellidos = u.apellidos,
                                fecha_nacimiento = u.fecha_nacimiento,
                                sexo = u.sexo,
                                direccion = u.direccion,
                                telefono = u.telefono,
                                correo = u.correo,
                                ciudad = u.ciudad
                            FROM (VALUES " . implode(', ', $placeholdersList) . ") AS u(nombre, apellidos, fecha_nacimiento, sexo, direccion, telefono, correo, ciudad, id_postulante)
                            WHERE p.id_postulante = u.id_postulante";
                    
                    DB::statement($sql, $bindings);
                }
            }

            // Realizar la inserción en lote de nuevos postulantes con RETURNING para mapear sus IDs en PostgreSQL
            if (!empty($postulantesInsertPayload)) {
                foreach (array_chunk($postulantesInsertPayload, 100) as $chunk) {
                    $columns = ['ci', 'nombre', 'apellidos', 'fecha_nacimiento', 'sexo', 'direccion', 'telefono', 'correo', 'ciudad'];
                    $colString = implode(', ', $columns);
                    
                    $placeholdersList = [];
                    $bindings = [];
                    foreach ($chunk as $row) {
                        $rowPlaceholders = [];
                        foreach ($columns as $col) {
                            $rowPlaceholders[] = '?';
                            $bindings[] = $row[$col];
                        }
                        $placeholdersList[] = '(' . implode(', ', $rowPlaceholders) . ')';
                    }
                    
                    $sql = "INSERT INTO t_postulante ($colString) VALUES " . implode(', ', $placeholdersList) . " RETURNING id_postulante, ci";
                    $resPostulantes = DB::select($sql, $bindings);
                    
                    foreach ($resPostulantes as $row) {
                        $postulanteMap[$row->ci] = $row->id_postulante;
                    }
                }
            }

            // B. Preparar t_requisitos_postulante
            $requisitosInsertPayload = [];
            foreach ($validItems as $item) {
                $ci = $item['ci'];
                $datos = $item['datos'];
                $idPostulante = $postulanteMap[$ci] ?? null;

                if ($idPostulante) {
                    $requisitosInsertPayload[] = [
                        'id_postulante' => $idPostulante,
                        'codigo_bachiller' => $datos['codigo_bachiller'] ?? null,
                        'fecha_bachiller' => $datos['fecha_bachiller'] ?? null,
                        'nombre_colegio' => $datos['nombre_colegio'] ?? null,
                        'tipo_colegio' => $datos['tipo_colegio'] ?? null,
                        'turno' => $datos['turno'] ?? null,
                        'id_carrera_1' => $datos['id_carrera_1'],
                        'id_carrera_2' => $datos['id_carrera_2'],
                        'modalidad'    => $datos['modalidad'],
                        'fecha_registro' => $datos['fecha_registro'] ?? now(),
                        'libreta' => false,
                        'ruta_cedula' => null,
                        'ruta_bachiller' => null,
                    ];
                }
            }

            // Inserción en lote de requisitos con RETURNING
            if (!empty($requisitosInsertPayload)) {
                foreach (array_chunk($requisitosInsertPayload, 100) as $chunk) {
                    $columns = [
                        'id_postulante', 'codigo_bachiller', 'fecha_bachiller', 'nombre_colegio', 
                        'tipo_colegio', 'turno', 'id_carrera_1', 'id_carrera_2', 'modalidad', 
                        'fecha_registro', 'libreta', 'ruta_cedula', 'ruta_bachiller'
                    ];
                    $colString = implode(', ', $columns);
                    
                    $placeholdersList = [];
                    $bindings = [];
                    foreach ($chunk as $row) {
                        $rowPlaceholders = [];
                        foreach ($columns as $col) {
                            $rowPlaceholders[] = '?';
                            $bindings[] = $row[$col];
                        }
                        $placeholdersList[] = '(' . implode(', ', $rowPlaceholders) . ')';
                    }
                    
                    $sql = "INSERT INTO t_requisitos_postulante ($colString) VALUES " . implode(', ', $placeholdersList) . " RETURNING id_requisito, id_postulante";
                    $resRequisitos = DB::select($sql, $bindings);
                    
                    foreach ($resRequisitos as $row) {
                        $requisitoMap[$row->id_postulante] = $row->id_requisito;
                    }
                }
            }

            // C. Preparar t_saldo, t_pago y t_usuario
            $saldosPayload = [];
            $pagosPayload = [];
            $usuariosInsertPayload = [];
            $usuariosUpdatePayload = [];
            
            // Re-agrupar usernames para no duplicar llaves en lote
            $insertedUsernames = [];

            foreach ($validItems as $item) {
                $ci = $item['ci'];
                $datos = $item['datos'];
                $idPostulante = $postulanteMap[$ci] ?? null;
                $idRequisito = $requisitoMap[$idPostulante] ?? null;

                if ($idPostulante && $idRequisito) {
                    // Saldo
                    $saldosPayload[] = [
                        'id_requisito' => $idRequisito,
                        'saldo' => 0,
                        'estado' => 'LIQUIDADO'
                    ];

                    // Pago
                    $pagosPayload[] = [
                        'id_postulante' => $idPostulante,
                        'monto' => $datos['monto'],
                        'fecha_pago' => $datos['fecha_pago'] ?? $datos['fecha_registro'] ?? now(),
                        'metodo_pago' => $datos['metodo_pago'],
                        'estado' => $datos['estado_pago'],
                        'transaccion_id' => $datos['transaccion_id'] ?? null,
                    ];

                    // Usuario
                    $primerNombre = explode(' ', trim(strtolower(self::quitarAcentos($datos['nombre']))))[0];
                    $primerApellido = explode(' ', trim(strtolower(self::quitarAcentos($datos['apellidos']))))[0];
                    $slugUsuario = $primerNombre . '.' . $primerApellido . substr($datos['ci'], -3);

                    $usuarioExistente = $existingUsers[$slugUsuario] ?? null;
                    if (!$usuarioExistente) {
                        if (!isset($insertedUsernames[$slugUsuario])) {
                            $usuariosInsertPayload[] = [
                                'usuario' => $slugUsuario,
                                'password' => password_hash($datos['ci'], PASSWORD_BCRYPT, ['cost' => 4]),
                                'nombre' => $datos['nombre'] . ' ' . $datos['apellidos'],
                                'correo' => $datos['correo'],
                                'estado' => true,
                                'id_rol' => 3,
                                'cambiar_password' => true,
                            ];
                            $insertedUsernames[$slugUsuario] = true;
                        }
                    } else {
                        // Guardar para actualizar en lote
                        $usuariosUpdatePayload[] = [
                            'id_usuario' => $usuarioExistente->id_usuario,
                            'nombre' => $datos['nombre'] . ' ' . $datos['apellidos'],
                            'correo' => $datos['correo'],
                        ];
                    }
                    
                    $registrados++;
                }
            }

            // Inserciones y actualizaciones finales en lote
            if (!empty($saldosPayload)) {
                foreach (array_chunk($saldosPayload, 100) as $chunk) {
                    DB::table('t_saldo')->insert($chunk);
                }
            }
            if (!empty($pagosPayload)) {
                foreach (array_chunk($pagosPayload, 100) as $chunk) {
                    DB::table('t_pago')->insert($chunk);
                }
            }
            if (!empty($usuariosInsertPayload)) {
                foreach (array_chunk($usuariosInsertPayload, 100) as $chunk) {
                    DB::table('t_usuario')->insert($chunk);
                }
            }
            if (!empty($usuariosUpdatePayload)) {
                foreach (array_chunk($usuariosUpdatePayload, 100) as $chunk) {
                    $columns = ['nombre', 'correo', 'id_usuario'];
                    $placeholdersList = [];
                    $bindings = [];
                    foreach ($chunk as $row) {
                        $placeholdersList[] = '(CAST(? AS VARCHAR), CAST(? AS VARCHAR), CAST(? AS INTEGER))';
                        foreach ($columns as $col) {
                            $bindings[] = $row[$col];
                        }
                    }
                    
                    $sql = "UPDATE t_usuario AS usr 
                            SET 
                                nombre = tmp.nombre,
                                correo = tmp.correo
                            FROM (VALUES " . implode(', ', $placeholdersList) . ") AS tmp(nombre, correo, id_usuario)
                            WHERE usr.id_usuario = tmp.id_usuario";
                    
                    DB::statement($sql, $bindings);
                }
            }

            DB::commit();

            \App\Services\BitacoraService::registrar(
                'POSTULANTES',
                'IMPORTACION MASIVA',
                "Se importaron exitosamente $registrados postulantes desde archivo CSV.",
                ['IP' => $ip, 'Registrados' => $registrados, 'Duplicados' => $duplicados],
                null,
                null
            );

            return [
                'registrados' => $registrados,
                'duplicados' => $duplicados,
                'errores' => $errores,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private static function prepararDatosFila(array $fila): array
    {
        $fechaNacimiento = self::convertirFecha($fila['fecha_nacimiento'] ?? null, '2000-01-01');
        $fechaBachiller = self::convertirFecha($fila['fecha_bachiller'] ?? null, null);

        $fechaRegistroVal = null;
        foreach ($fila as $k => $v) {
            $norm = strtolower(trim($k));
            if (str_starts_with($norm, 'fecha_reg')) {
                $fechaRegistroVal = $v;
                break;
            }
        }
        $fechaRegistro = self::convertirFechaRegistro($fechaRegistroVal, now()->format('Y-m-d H:i:s'));

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
            'fecha_registro' => $fechaRegistro,
            'fecha_pago' => $fechaRegistro,
        ];
    }

    private static function parseDateRobust($valor, $default, $outputFormat = 'Y-m-d H:i:s')
    {
        if (empty($valor)) {
            return $default;
        }

        // Si es numérico (fecha serial de Excel)
        if (is_numeric($valor)) {
            try {
                if (class_exists('\PhpOffice\PhpSpreadsheet\Shared\Date')) {
                    $dateTime = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($valor);
                    return Carbon::instance($dateTime)->format($outputFormat);
                }
                return Carbon::createFromDate(1899, 12, 30)->addDays($valor)->format($outputFormat);
            } catch (\Exception $e) {
                try {
                    return Carbon::createFromDate(1899, 12, 30)->addDays($valor)->format($outputFormat);
                } catch (\Exception $ex) {
                    return $default;
                }
            }
        }

        $valorStr = trim((string)$valor);
        if (empty($valorStr)) {
            return $default;
        }

        // Normalizar slashes a guiones para evitar que PHP asuma formato americano MM/DD/YYYY
        $normalized = $valorStr;
        if (strpos($normalized, '/') !== false) {
            if (!preg_match('/^\d{4}/', $normalized)) {
                $normalized = str_replace('/', '-', $normalized);
            }
        }

        try {
            return Carbon::parse($normalized)->format($outputFormat);
        } catch (\Exception $e) {
            $formats = [
                'd-m-Y H:i:s', 'd-m-Y H:i', 'd-m-Y',
                'Y-m-d H:i:s', 'Y-m-d H:i', 'Y-m-d',
                'd/m/Y H:i:s', 'd/m/Y H:i', 'd/m/Y',
            ];
            foreach ($formats as $fmt) {
                try {
                    return Carbon::createFromFormat($fmt, $valorStr)->format($outputFormat);
                } catch (\Exception $ex) {
                    continue;
                }
            }
        }

        return $default;
    }

    private static function convertirFecha($valor, $default)
    {
        return self::parseDateRobust($valor, $default, 'Y-m-d');
    }

    private static function convertirFechaRegistro($valor, $default)
    {
        return self::parseDateRobust($valor, $default, 'Y-m-d H:i:s');
    }
}
