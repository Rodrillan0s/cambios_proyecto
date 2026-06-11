FROM php:8.3-cli

WORKDIR /var/www

# ========================
# DEPENDENCIAS PHP
# ========================
RUN apt-get update && apt-get install -y \
    git unzip zip curl \
    libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl gd

# ========================
# NODE + NPM (IMPORTANTE)
# ========================
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# ========================
# COMPOSER
# ========================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# ========================
# COPIAR PROYECTO
# ========================
COPY . .

# ========================
# INSTALL BACKEND
# ========================
RUN composer install --no-interaction --prefer-dist

# ========================
# INSTALL FRONTEND + BUILD VITE
# ========================
RUN npm install
RUN npm run build

# ========================
# PERMISOS
# ========================
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000