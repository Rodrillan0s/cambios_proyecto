FROM php:8.3-fpm

WORKDIR /var/www

# =========================
# DEPENDENCIAS DEL SISTEMA
# =========================
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    curl \
    pkg-config \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# =========================
# EXTENSIONES PHP (SEPARADAS PARA EVITAR FALLAS)
# =========================

# PostgreSQL (CRÍTICO)
RUN docker-php-ext-install pdo_pgsql

# Otras extensiones
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mbstring \
    zip \
    exif \
    pcntl \
    gd

# GD config
RUN docker-php-ext-configure gd --with-freetype --with-jpeg

# =========================
# NODEJS (VITE)
# =========================
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# =========================
# COMPOSER
# =========================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# =========================
# PROYECTO
# =========================
COPY . .

# =========================
# BACKEND
# =========================
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# =========================
# LIMPIAR BUILD VIEJO
# =========================
RUN rm -rf public/build

# =========================
# FRONTEND (VITE)
# =========================
RUN npm install --legacy-peer-deps
RUN npm run build

# =========================
# PERMISOS
# =========================
RUN chmod -R 777 storage bootstrap/cache

# =========================
# PUERTO RENDER
# =========================
EXPOSE 10000

# =========================
# START
# =========================
CMD php artisan serve --host=0.0.0.0 --port=10000