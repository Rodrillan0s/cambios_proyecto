<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TokenRecuperacion;
use App\Services\BitacoraService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Mostrar la vista de solicitud de enlace de recuperación.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Manejar la solicitud de enlace de recuperación.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'correo' => ['required', 'email'],
        ]);

        $user = User::where('correo', $request->correo)->first();

        if ($user) {
            $tokenRaw = Str::random(60);
            TokenRecuperacion::create([
                'id_usuario' => $user->id_usuario,
                'token_hash' => hash('sha256', $tokenRaw),
                'fecha_expiracion' => now()->addMinutes(15),
                'usado' => false
            ]);

            BitacoraService::registrar(
                'SEGURIDAD',
                'SOLICITUD_RECUPERACION',
                'Se solicitó un enlace de recuperación para el correo: ' . $request->correo,
                 [
                   'IP:' => $request->ip()
                 ],
            );

            $urlRecuperacion = route('password.reset', ['token' => $tokenRaw]);

            Mail::raw("Haz clic en el siguiente enlace para recuperar tu contraseña: $urlRecuperacion", function ($message) use ($user) {
                $message->to($user->correo)
                        ->subject('CUP-FICCT-notify – Recuperación de contraseña');
            });
        } 
        return back()->with('status', 'Si el correo está registrado, se enviará un enlace de recuperación.');
    }
}