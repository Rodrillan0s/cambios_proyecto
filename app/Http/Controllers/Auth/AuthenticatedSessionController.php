<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $loginValue = $request->input('login');
        $fieldType = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'correo' : 'usuario';

        $credentials = [
            $fieldType => $loginValue,
            'password' => $request->input('password'),
        ];

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'login' => 'Las credenciales proporcionadas son incorrectas.',
            ]);
        }

        $user = Auth::user();
        $correo = $user->correo;
        if ($user->estado !== true) {
            Auth::logout();
            throw ValidationException::withMessages([
                'login' => 'Tu cuenta está inactiva. Contacta con el administrador.',
            ]);
        }

        $request->session()->regenerate();

        $idSesion = DB::table('cup.t_sesiones')->insertGetId([
            'id_usuario' => $user->id_usuario,
            'ip_direccion' => $request->ip(),
            'estado' => 'ACTIVA',
            'fecha_inicio' => now(),
        ],'id_sesion');

        $request->session()->put('id_sesion', $idSesion);
        BitacoraService::registrar(
            'AUTENTICACIÓN', 
            'LOGIN', 
            'Usuario ' . $user->nombre . ' (' . $correo . ') inició sesión.',
            [
               'IP:' => $request->ip()
            ]
        );

     return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
      $user = Auth::user();
      $idUsuario = $user ? $user->id_usuario : null;
      $nombreUsuario = $user ? $user->nombre : 'Desconocido';
      $correoUsuario = $user ? $user->correo : 'Desconocido';

      $idSesion = session('id_sesion');
        if ($idSesion) {
            DB::table('cup.t_sesiones')
                ->where('id_sesion', $idSesion)
                ->update([
                    'estado' => 'INACTIVA',
                    'fecha_fin' => now(),
                ]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

     BitacoraService::registrar(
          'AUTENTICACIÓN',
           'LOGOUT',
           'Usuario ' . $nombreUsuario . ' (' . $correoUsuario . ') cerró sesión.',
            [
               'IP:' => $request->ip()
            ],
            $idUsuario,
            $idSesion
     );
        return redirect('/');
    }
}
