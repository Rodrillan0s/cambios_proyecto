<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // 1. Registramos los middlewares globales para la capa web
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\ForcePasswordChange::class,
        ]);

        // 2. UNIFICADO: Registramos el alias de tu middleware personalizado aquí mismo
        $middleware->alias([
            'permiso' => \App\Http\Middleware\EnsureUserHasPermission::class,
        ]);

        // 3. Confiar en todos los proxies para resolver HTTPS detrás del balanceador de carga de Render
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();