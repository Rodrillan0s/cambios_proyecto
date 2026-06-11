FROM php:8.3-cli

WORKDIR /var/www

# =========================
# DEPENDENCIAS SISTEMA
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
# EXTENSIONES PHP
# =========================
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        zip \
        exif \
        pcntl \
        gd

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
# COPIAR PROYECTO
# =========================
COPY . .

# =========================
# DEPENDENCIAS BACKEND
# =========================
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# =========================
# FRONTEND (VITE BUILD)
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