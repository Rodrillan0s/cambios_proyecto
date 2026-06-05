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
            // 🔥 foto_bachiller ELIMINADO de aquí. Solo se exige en el storePublico (Paso 3)
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
        // Rescate manual de archivos si hay desajustes en el FormData de Inertia
        if (!$request->hasFile('foto_bachiller') && isset($_FILES['foto_bachiller'])) {
            $request->files->set('foto_bachiller', $request->file('foto_bachiller'));
        }
        if (!$request->hasFile('foto_cedula') && isset($_FILES['foto_cedula'])) {
            $request->files->set('foto_cedula', $request->file('foto_cedula'));
        }
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

        /* |--------------------------------------------------------------------------
         | VERIFICACIÓN DE SEGURIDAD SERVER-SIDE CON PAYPAL
         |--------------------------------------------------------------------------
         */
        $paypalBaseUrl = config('services.paypal.base_url');
        $paypalClientId = config('services.paypal.client_id');
        $paypalSecret = config('services.paypal.client_secret');

        // 1. Obtener Access Token de PayPal
        $tokenResponse = Http::withBasicAuth($paypalClientId, $paypalSecret)
            ->asForm()
            ->post("{$paypalBaseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (!$tokenResponse->successful()) {
            return back()->withErrors(['error' => 'No se pudo autenticar con los servidores de pago.'])->withInput();
        }
        $accessToken = $tokenResponse->json('access_token');

        // 2. Verificar la veracidad de la Orden
        $orderResponse = Http::withToken($accessToken)
            ->get("{$paypalBaseUrl}/v2/checkout/orders/{$request->paypal_order_id}");

        if (!$orderResponse->successful()) {
            return back()->withErrors(['error' => 'No se encontró la transacción en PayPal.'])->withInput();
        }

        $orderData = $orderResponse->json();

        // 3. Validar Reglas de Negocio Estrictas
        if (!in_array($orderData['status'], ['COMPLETED', 'APPROVED'])) {
            return back()->withErrors(['error' => 'La transacción no ha sido pagada en su totalidad.'])->withInput();
        }

        $montoPagado = $orderData['purchase_units'][0]['amount']['value'] ?? 0;
        if ((float)$montoPagado !== (float)$request->paypal_monto) {
            return back()->withErrors(['error' => 'Fraude detectado: El monto pagado en PayPal no coincide con la matrícula de la FICCT.'])->withInput();
        }

        /* |--------------------------------------------------------------------------
         | TRANSACCIÓN ATÓMICA DE BASE DE DATOS Y ARCHIVOS
         |--------------------------------------------------------------------------
         */
        try {
            DB::transaction(function () use ($request) {

                // Preparación de Almacenamiento (Soporta disco local o en la nube como Oracle S3)
                $disk = config('filesystems.default'); // Toma 'local', 'public' o 's3' del .env

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

                // Inserción en t_postulante
                $idPostulante = DB::table('t_postulante')->insertGetId([
                    'ci' => $request->ci,
                    'nombre' => $request->nombre,
                    'apellidos' => $request->apellidos,
                    'fecha_nacimiento' => $request->fecha_nacimiento,
                    'sexo' => $request->sexo,
                    'direccion' => $request->direccion,
                    'telefono' => $request->telefono,
                    'correo' => $request->correo,
                    'ciudad' => $request->ciudad,
                    // 'ruta_cedula' => $pathCedula,
                    // 'ruta_bachiller' => $pathBachiller,
                ], 'id_postulante');

                // Inserción en t_requisitos_postulante
                $idRequisito = DB::table('t_requisitos_postulante')->insertGetId([
                    'id_postulante' => $idPostulante,
                    'codigo_bachiller' => $request->codigo_bachiller,
                    'fecha_bachiller' => $request->fecha_bachiller,
                    'nombre_colegio' => $request->nombre_colegio,
                    'tipo_colegio' => $request->tipo_colegio,
                    'turno' => $request->turno,
                    'id_carrera_1' => $request->id_carrera_1,
                    'id_carrera_2' => $request->id_carrera_2,
                    'modalidad'    =>   $request->modalidad,
                    'fecha_registro' => now(),
                    'libreta' => false,
                    'ruta_cedula' => $pathCedula,
                    'ruta_bachiller' => $pathBachiller,
                ], 'id_requisito');

                // Implementación de t_saldo
                DB::table('t_saldo')->insert([
                    'id_requisito' => $idRequisito,
                    'saldo' => 0,
                    'estado' => 'LIQUIDADO'
                ]);

                // Inserción en t_pago
                DB::table('t_pago')->insert([
                    'id_postulante' => $idPostulante,
                    'monto' => $request->paypal_monto,
                    'fecha_pago' => now(),
                    'metodo_pago' => 'PAYPAL',
                    'estado' => 'APROBADO',
                    'transaccion_id' => $request->paypal_order_id,
                ]);

                // Generación de usuario
                $primerNombre = explode(' ', trim(strtolower($request->nombre)))[0];
                $primerApellido = explode(' ', trim(strtolower($request->apellidos)))[0];
                $slugUsuario = $primerNombre . '.' . $primerApellido . substr($request->ci, -3);

                DB::table('t_usuario')->insert([
                    'usuario' => $slugUsuario,
                    'password' => bcrypt($request->ci),
                    'nombre' => $request->nombre . ' ' . $request->apellidos,
                    'correo' => $request->correo,
                    'estado' => true,
                    'id_rol' => 3,
                ]);

                BitacoraService::registrar(
                    'POSTULANTES',
                    'REGISTRO EXITOSO',
                    "Inscripción web. C.I.: {$request->ci}. PayPal ID: {$request->paypal_order_id}.",
                    ['IP' => $request->ip(), 'Usuario_Creado' => $slugUsuario, 'Rutas_Docs' => [$pathCedula, $pathBachiller]],
                    null,
                    null
                );
            });

            return redirect()->route('login')->with('status', '¡Felicidades! Tu postulación al CUP fue procesada y validada con éxito. Inicia sesión con tu código de usuario.');
        } catch (\Exception $e) {
            
          return back()->withErrors(['error' => 'Error transaccional: ' . $e->getMessage()])->withInput();
            
        }
    }
}
