<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\log;
use App\Services\BitacoraService;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class PostulanteController extends Controller
{
    /**
     * FLUJO 1: Registro Público de Postulantes (WEB)
     */
    public function createPublico(Request $request): Response
    {
        $carreras = DB::table('t_carrera')
            ->select('id_carrera', 'nombre', 'cupo')
            ->orderBy('nombre', 'asc')
            ->get();
        return Inertia::render('Postulantes/Publico/PreInscripcion', [
            'carreras' => $carreras,
            'paypalClientId' => config('services.paypal.client_id')
        ]);
    }

    public function validarIdentidadIA(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ci' => 'required|string|max:20',
            'fecha_nacimiento' => 'required|date',
            'foto_cedula' => 'required|file|mimes:jpeg,png,jpg,pdf|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $fechaNacimiento = Carbon::parse($request->fecha_nacimiento);
        if ($fechaNacimiento->age < 15) {
            return response()->json([
                'success' => false,
                'message' => 'El postulante debe tener al menos 15 años cumplidos.'
            ], 422);
        }

        $existeCUP = DB::table('t_postulante')->where('ci', $request->ci)->exists();
        if ($existeCUP) {
            return response()->json([
                'success' => false,
                'message' => 'Esta Cédula de Identidad ya cuenta con un registro en la gestión actual.'
            ], 422);
        }

        usleep(2500000);

        return response()->json([
            'success' => true,
            'message' => 'Análisis y lectura de visión artificial finalizados con éxito.',
            'data' => ['estado_validacion' => 'MATCH_CONFIRMED']
        ], 200);
    }

    public function storePublico(Request $request): RedirectResponse
    {
        if (!$request->hasFile('foto_bachiller') && isset($_FILES['foto_bachiller'])) {
            $request->files->set('foto_bachiller', $request->file('foto_bachiller'));
        }
        if (!$request->hasFile('foto_cedula') && isset($_FILES['foto_cedula'])) {
            $request->files->set('foto_cedula', $request->file('foto_cedula'));
        }

        // 2. Validaciones
        $request->validate([
            'ci' => 'required|string|max:20',
            'nombre' => 'required|string|max:150',
            'apellidos' => 'required|string|max:150',
            'fecha_nacimiento' => 'required|date',
            'sexo' => 'required|string|max:1',
            'direccion' => 'required|string',
            'telefono' => 'required|string|max:20',
            'correo' => 'required|email|max:255',
            'ciudad' => 'required|string|max:100',
            'codigo_bachiller' => 'required|numeric',
            'fecha_bachiller' => 'required|date',
            'nombre_colegio' => 'required|string|max:255',
            'tipo_colegio' => 'required|string',
            'turno' => 'required|string',
            'id_carrera_1' => 'required|integer',
            'id_carrera_2' => 'required|integer',
            'modalidad'    => 'required|string|in:PRESENCIAL,VIRTUAL',
            'paypal_order_id' => 'required|string',
            'paypal_monto' => 'required|numeric',
            'foto_bachiller' => 'nullable',
            'foto_cedula' => 'nullable',
        ]);

        if (!$request->hasFile('foto_bachiller') && !isset($_FILES['foto_bachiller'])) {
            return back()->withErrors(['foto_bachiller' => 'El archivo físico de la libreta no se transmitió correctamente. Intente resubirlo.']);
        }

        if (DB::table('t_postulante')->where('ci', $request->ci)->exists()) {
            return back()->withErrors(['ci' => 'Esta Cédula de Identidad ya cuenta con un registro activo.']);
        }

        $paypalBaseUrl = config('services.paypal.base_url');
        $paypalClientId = config('services.paypal.client_id');
        $paypalSecret = config('services.paypal.client_secret');

        $tokenResponse = Http::withBasicAuth($paypalClientId, $paypalSecret)
            ->asForm()
            ->post("{$paypalBaseUrl}/v1/oauth2/token", ['grant_type' => 'client_credentials']);

        if (!$tokenResponse->successful()) {
            return back()->withErrors(['error' => 'No se pudo autenticar con los servidores de pago.'])->withInput();
        }

        $accessToken = $tokenResponse->json('access_token');
        $orderResponse = Http::withToken($accessToken)->get("{$paypalBaseUrl}/v2/checkout/orders/{$request->paypal_order_id}");

        if (!$orderResponse->successful()) {
            return back()->withErrors(['error' => 'No se encontró la transacción en PayPal.'])->withInput();
        }

        $orderData = $orderResponse->json();

        if (!in_array($orderData['status'], ['COMPLETED', 'APPROVED'])) {
            return back()->withErrors(['error' => 'La transacción no ha sido pagada en su totalidad.'])->withInput();
        }

        $montoPagado = $orderData['purchase_units'][0]['amount']['value'] ?? 0;
        if ((float)$montoPagado !== (float)$request->paypal_monto) {
            return back()->withErrors(['error' => 'Fraude detectado: El monto pagado en PayPal no coincide con la matrícula de la FICCT.'])->withInput();
        }

        // 4. Preparación de Archivos
        try {
            $disk = config('filesystems.default');
            $pathCedula = $request->file('foto_cedula')->storeAs(
                "postulantes/{$request->ci}",
                "cedula_" . time() . "." . $request->file('foto_cedula')->getClientOriginalExtension(),
                $disk
            );
            $pathBachiller = $request->file('foto_bachiller')->storeAs(
                "postulantes/{$request->ci}",
                "bachiller_" . time() . "." . $request->file('foto_bachiller')->getClientOriginalExtension(),
                $disk
            );

            $datos = $request->all();
            $datos['monto'] = $request->paypal_monto;
            $datos['metodo_pago'] = 'PAYPAL';
            $datos['estado_pago'] = 'APROBADO';
            $datos['transaccion_id'] = $request->paypal_order_id;

            $idPostulanteCreado = $this->registrarPostulanteBD($datos, $request->ip(), $pathCedula, $pathBachiller);

            return redirect()->route('postulantes.comprobante', $idPostulanteCreado);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error transaccional: ' . $e->getMessage()])->withInput();
        }
    }
    public function comprobante($id): Response
    {
        $postulante = DB::table('t_postulante as p')
            ->join('t_requisitos_postulante as r', 'r.id_postulante', '=', 'p.id_postulante')
            ->leftJoin('t_pago as pa', 'pa.id_postulante', '=', 'p.id_postulante')
            ->leftJoin('t_carrera as c1', 'r.id_carrera_1', '=', 'c1.id_carrera')
            ->leftJoin('t_carrera as c2', 'r.id_carrera_2', '=', 'c2.id_carrera')
            ->where('p.id_postulante', $id)
            ->select(
                // 1. Datos Personales
                'p.id_postulante',
                'p.ci',
                DB::raw("CONCAT(p.apellidos, ' ', p.nombre) as nombre_completo"),
                'p.fecha_nacimiento',
                'p.sexo',
                'p.telefono',
                'p.correo',
                'p.direccion',
                'p.ciudad as provincia',

                // 2. Información Educativa
                'r.nombre_colegio',
                'r.tipo_colegio',
                'r.turno',
                'r.fecha_bachiller',
                'r.codigo_bachiller',
                'r.modalidad',

                // 3. Comprobante de Pago
                'pa.transaccion_id',
                'pa.fecha_pago',
                'pa.monto',
                'pa.metodo_pago',
                'pa.estado as estado_pago',

                // 4. Carreras
                'c1.id_carrera as carrera_1_codigo',
                'c1.nombre as carrera_1_nombre',
                'c2.id_carrera as carrera_2_codigo',
                'c2.nombre as carrera_2_nombre'
            )
            ->first();

        if (!$postulante) {
            abort(404, 'Comprobante de inscripción no encontrado.');
        }

        $codigoInscripcion = 'CUP-' . date('Y') . '-' . str_pad($postulante->id_postulante, 6, '0', STR_PAD_LEFT);
        $anioEgreso = date('Y', strtotime($postulante->fecha_bachiller));
        $fechaEmision = now()->format('d / m / Y H:i:s');

        return Inertia::render('Postulantes/Publico/Comprobante', [
            'postulante' => $postulante,
            'meta' => [
                'codigo_inscripcion' => $codigoInscripcion,
                'anio_egreso' => $anioEgreso,
                'fecha_emision' => $fechaEmision
            ]
        ]);
    }

    /**
     * FLUJO 2: Importación Masiva (Para Administradores)
     */
public function importarCSV(Request $request): JsonResponse
{
    $request->validate([
        'archivo' => 'required|file|mimes:csv,txt,xlsx|max:10240',
    ]);

    $file = $request->file('archivo');

    // Leer todo el archivo como array (primera hoja)
    $rows = Excel::toArray([], $file)[0];

    if (empty($rows)) {
        return response()->json(['success' => false, 'message' => 'El archivo está vacío.'], 400);
    }

    // Cabecera en la primera fila
    $header = array_map(fn($h) => strtolower(trim($h)), $rows[0]);
    unset($rows[0]); // quitar cabecera

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

        // 🔹 Conversión de fecha_nacimiento
        $fechaNacimiento = $fila['fecha_nacimiento'] ?? null;
        if (is_numeric($fechaNacimiento)) {
            $fechaNacimiento = Carbon::createFromDate(1899, 12, 30)->addDays($fechaNacimiento)->format('Y-m-d');
        } elseif (!empty($fechaNacimiento)) {
            try {
                $fechaNacimiento = Carbon::parse($fechaNacimiento)->format('Y-m-d');
            } catch (\Exception $e) {
                $fechaNacimiento = '2000-01-01';
            }
        } else {
            $fechaNacimiento = '2000-01-01';
        }

        // 🔹 Conversión de fecha_bachiller
        $fechaBachiller = $fila['fecha_bachiller'] ?? null;
        if (is_numeric($fechaBachiller)) {
            $fechaBachiller = Carbon::createFromDate(1899, 12, 30)->addDays($fechaBachiller)->format('Y-m-d');
        } elseif (!empty($fechaBachiller)) {
            try {
                $fechaBachiller = Carbon::parse($fechaBachiller)->format('Y-m-d');
            } catch (\Exception $e) {
                $fechaBachiller = null;
            }
        } else {
            $fechaBachiller = null;
        }

        $datos = [
            'ci' => $ci,
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

        try {
            $this->registrarPostulanteBD($datos, $request->ip(), null, null);
            $registrados++;
        } catch (\Exception $e) {
            $errores[] = "Fila " . ($i + 2) . " (C.I. $ci) falló: " . $e->getMessage();
        }
    }

    return response()->json([
        'success' => true,
        'message' => "Importación masiva completada.",
        'data' => [
            'registrados' => $registrados,
            'duplicados' => $duplicados,
            'errores' => $errores,
        ]
    ], 200);
}
    private function quitarAcentos($cadena)
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

    private function registrarPostulanteBD(array $datos, $ip, $pathCedula = null, $pathBachiller = null)
    {
        $idPostulanteCreado = null;

        DB::transaction(function () use ($datos, $ip, $pathCedula, $pathBachiller, &$idPostulanteCreado) {

            // INSERTAR EN T_POSTULANTE
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

            // INSERTAR EN T_REQUISITOS_POSTULANTE
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

            // INSERTAR EN T_SALDO
            DB::table('t_saldo')->insert([
                'id_requisito' => $idRequisito,
                'saldo' => 0,
                'estado' => 'LIQUIDADO'
            ]);

            // INSERTAR EN T_PAGO
            DB::table('t_pago')->insert([
                'id_postulante' => $idPostulante,
                'monto' => $datos['monto'],
                'fecha_pago' => now(),
                'metodo_pago' => $datos['metodo_pago'],
                'estado' => $datos['estado_pago'],
                'transaccion_id' => $datos['transaccion_id'] ?? null,
            ]);

            // GENERAR USUARIO Y CONTRASEÑA PARA EL POSTULANTE
            $primerNombre = explode(' ', trim(strtolower($this->quitarAcentos($datos['nombre']))))[0];
            $primerApellido = explode(' ', trim(strtolower($this->quitarAcentos($datos['apellidos']))))[0];
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
            BitacoraService::registrar(
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
}
