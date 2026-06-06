<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostulanteController; // <-- Importamos tu controlador principal
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        // Eliminamos 'canRegister' porque el registro ahora es exclusivo de /preinscripcion
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// FLUJO 1: RUTAS PÚBLICAS DE PREINSCRIPCIÓN (Postulantes)
Route::get('/preinscripcion', [PostulanteController::class, 'createPublico'])
    ->name('postulantes.create.publico');

// 2. Endpoint de Validación Perimetral / IA
Route::post('/preinscripcion/validar-ia', [PostulanteController::class, 'validarIdentidadIA'])
    ->name('postulantes.validar.ia');

// 3. Endpoint Transaccional Final (Pago y Guardado)
Route::post('/preinscripcion/completar', [PostulanteController::class, 'storePublico'])
    ->name('postulantes.store.publico');

Route::get(
    '/preinscripcion/comprobante/{id}',
    [PostulanteController::class, 'comprobante']
)->name('postulantes.comprobante');

Route::post('/admin/importar-postulantes', [PostulanteController::class, 'importarCSV'])
    ->name('admin.importar.csv');

// RUTAS PROTEGIDAS DEL DASHBOARD BÁSICO
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
