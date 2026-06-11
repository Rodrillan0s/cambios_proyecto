FROM php:8.2-cli

WORKDIR /var/www

# =========================
# DEPENDENCIAS DEL SISTEMA
# =========================
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    curl \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl

# =========================
# COMPOSER
# =========================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# =========================
# COPIAR SOLO ARCHIVOS NECESARIOS PRIMERO
# (esto evita errores de composer)
# =========================
COPY composer.json composer.lock ./

RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader

# =========================
# COPIAR TODO EL PROYECTO
# =========================
COPY . .

# =========================
# FINALIZAR COMPOSER
# =========================
RUN composer dump-autoload --optimize

# =========================
# PERMISOS LARAVEL
# =========================
RUN chmod -R 777 storage bootstrap/cache

# =========================
# PUERTO RENDER
# =========================
EXPOSE 10000

# =========================
# START SERVER
# =========================
CMD php artisan serve --host=0.0.0.0 --port=10000