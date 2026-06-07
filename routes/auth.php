<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\PostulanteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// =====================================================================
// VISITANTES (Solo Login y Recuperación de Contraseña)
// =====================================================================
Route::middleware('guest')->group(function () {
    // ⚠️ ATENCIÓN: Se eliminaron las rutas GET/POST de 'register' para cerrar la brecha de seguridad.

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
    //BORRAR LUEGO
    Route::get('/register', function () {
        return Inertia::render('Auth/Register');
    });
});

// =====================================================================
// NÚCLEO DEL SISTEMA PROTEGIDO (Usuarios Logueados)
// =====================================================================
Route::middleware('auth')->group(function () {

    // --- RUTAS POR DEFECTO DE BREEZE ---
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])->middleware('throttle:6,1')->name('verification.send');
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);
    Route::put('password', [PasswordController::class, 'update'])->name('password.update');
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');


    // CRUD Interno de Usuarios (El controlador que refactorizamos)
    Route::get('/usuarios', [RegisteredUserController::class, 'index'])
        ->middleware('permiso:listar_usuarios')->name('usuarios.index');
    Route::get('/usuarios/crear', [RegisteredUserController::class, 'create'])
        ->middleware('permiso:registrar_usuario')->name('usuarios.create');
    Route::post('/usuarios', [RegisteredUserController::class, 'store'])
        ->middleware('permiso:registrar_usuario')->name('usuarios.store');
    Route::put('/usuarios/{id}', [RegisteredUserController::class, 'update'])
        ->middleware('permiso:modificar_usuario')->name('usuarios.update');

    // --- MÓDULO 2: POSTULANTES (Flujo 2 y 3: Gestión Interna) ---
    Route::get('/postulantes', [PostulanteController::class, 'index'])
        ->middleware('permiso:listar_postulantes')->name('postulantes.index');

    Route::post('/postulantes', [PostulanteController::class, 'store'])
        ->middleware('permiso:registrar_postulante')->name('postulantes.store');

    Route::put('/postulantes/{id}', [PostulanteController::class, 'update'])
        ->middleware('permiso:modificar_postulante')->name('postulantes.update');

    Route::delete('/postulantes/{id}', [PostulanteController::class, 'destroy'])
        ->middleware('permiso:eliminar_postulante')->name('postulantes.destroy');

    Route::post('/postulantes/{id}/validar-documentos', [PostulanteController::class, 'validarDocumentos'])
        ->middleware('permiso:validar_documentos');

    Route::get('/postulantes/{id}/documentos', [PostulanteController::class, 'visualizarDocumentos'])
        ->middleware('permiso:visualizar_documentos');

    Route::post('/postulantes/importar', [PostulanteController::class, 'importar'])
        ->middleware('permiso:importar_postulantes')->name('postulantes.importar');
});
