<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
{
    $request->validate([
        'nombre' => ['required', 'string', 'max:100'],
        'usuario' => ['required', 'string', 'max:50', 'unique:t_usuario,usuario'],
        'correo' => ['required', 'string', 'lowercase', 'email', 'max:100'],
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
    ]);

    // Nota: Usamos Hash::make para la contraseña (y Breeze ya lo hace automáticamente)
    $user = User::create([
        'nombre' => $request->nombre,
        'usuario' => $request->usuario,
        'correo' => $request->correo,
        'password' => Hash::make($request->password),
        'id_rol' => 3,    // Definimos el rol por defecto (ej. Administrador o Postulante)
    ]);

    event(new Registered($user));

    Auth::login($user);

    return redirect(route('dashboard', absolute: false));
}
}
