#!/bin/bash

# Terminar inmediatamente si un comando falla
set -e

# Ejecutar scripts post-instalación de composer
composer run-script post-autoload-dump

# Optimizar y cachear configuración de Laravel en producción
echo "Cacheando configuración y rutas para producción..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones automáticamente si se configura la variable
if [ "${RUN_MIGRATIONS}" = "true" ]; then
    echo "Ejecutando migraciones de base de datos..."
    php artisan migrate --force
fi

# Ejecutar el comando principal (Supervisor)
exec "$@"
