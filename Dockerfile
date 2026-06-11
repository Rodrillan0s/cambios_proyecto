FROM php:8.3-cli

WORKDIR /var/www

# =========================
# DEPENDENCIAS SISTEMA
# =========================
RUN apt-get update && apt-get install -y \
    git unzip zip curl \
    libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl gd

# =========================
# NODEJS (PARA VITE)
# =========================
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# =========================
# COMPOSER
# =========================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# =========================
# COPIAR PROYECTO
# =========================
COPY . .

# =========================
# BACKEND
# =========================
RUN composer install --no-interaction --prefer-dist

# =========================
# FRONTEND (ESTO ES LO QUE TE FALTA)
# =========================
RUN npm install
RUN npm run build

# =========================
# PERMISOS LARAVEL
# =========================
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000