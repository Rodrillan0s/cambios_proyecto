<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TokenRecuperacion;
use App\Services\BitacoraService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Mostrar la vista de restablecimiento de contraseña.
     */
    public function create(Request $request, string $token): Response
    {
        $tokenHash = hash('sha256', $token);

        // Verificamos preventivamente si el token es válido y está vigente
        $tokenValido = TokenRecuperacion::where('token_hash', $tokenHash)
            ->where('usado', false)
            ->where('fecha_expiracion', '>', now())
            ->exists();

        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'errorToken' => !$tokenValido // Si no es válido, pasará como true
        ]);
    }

    /**
     * Manejar la solicitud de nueva contraseña.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'password' => 'required|confirmed|min:8',
        ]);

        $tokenHash = hash('sha256', $request->token);

        $tokenRegistro = TokenRecuperacion::where('token_hash', $tokenHash)
            ->where('usado', false)
            ->where('fecha_expiracion', '>', now())
            ->first();

        if (!$tokenRegistro) {
            return back()->withErrors(['token' => 'El enlace de recuperación es inválido o ha expirado.']);
        }

        $user = User::find($tokenRegistro->id_usuario);

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        $tokenRegistro->update(['usado' => true]);

        TokenRecuperacion::where('id_usuario', $user->id_usuario)
            ->where('usado', false)
            ->update(['usado' => true]);

        BitacoraService::registrar(
            'SEGURIDAD',
            'CONTRASENA_RESTABLECIDA',
            'El usuario ' . $user->usuario . ' (' . $user->correo . ') restableció su contraseña con éxito.',
            [
                'IP' => $request->ip(),
            ]
        );

        return redirect()->route('login')->with('status', 'Tu contraseña ha sido restablecida correctamente.');
    }
}