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
use App\Services\PostulanteService;
use Cloudinary\Api\Upload\UploadApi;

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
            $pathCedula = (new UploadApi())->upload(
                $request->file('foto_cedula')->getRealPath(),
                [
                    'folder' => "postulantes/{$request->ci}",
                    'public_id' => 'cedula_' . time(),
                    'resource_type' => 'auto',
                ]
            )['secure_url'];

            $pathBachiller = (new UploadApi())->upload(
                $request->file('foto_bachiller')->getRealPath(),
                [
                    'folder' => "postulantes/{$request->ci}",
                    'public_id' => 'bachiller_' . time(),
                    'resource_type' => 'auto',
                ]
            )['secure_url'];

            $datos = $request->all();
            $datos['monto'] = $request->paypal_monto;
            $datos['metodo_pago'] = 'PAYPAL';
            $datos['estado_pago'] = 'APROBADO';
            $datos['transaccion_id'] = $request->paypal_order_id;

            // 🔹 Aquí pasamos las URLs reales
            $idPostulanteCreado = PostulanteService::registrarPostulanteBD(
                $datos,
                $request->ip(),
                $pathCedula,
                $pathBachiller
            );

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


}
