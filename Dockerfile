FROM php:8.3-cli

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
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev

# =========================
# EXTENSIONES PHP (IMPORTANTE)
# =========================
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo \
    pdo_mysql \
    mbstring \
    zip \
    exif \
    pcntl \
    gd

# =========================
# COMPOSER
# =========================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# =========================
# COPY COMPOSER FIRST
# =========================
COPY composer.json composer.lock ./

RUN composer install --no-interaction --prefer-dist --no-scripts

# =========================
# COPY FULL PROJECT
# =========================
COPY . .

RUN composer dump-autoload --optimize

# =========================
# PERMISOS LARAVEL
# =========================
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000