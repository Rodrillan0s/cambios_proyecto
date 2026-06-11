# --- Stage 1: Compilación de Frontend Assets ---
FROM node:20-alpine AS node-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Construcción de la Aplicación PHP ---
FROM php:8.2-fpm-alpine

# Instalar dependencias del sistema y herramientas de compilación
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    bash \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Instalar extensiones PHP necesarias para Laravel y PostgreSQL
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_pgsql pgsql zip bcmath gd opcache

# Descargar Composer oficial
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Configurar directorio de trabajo
WORKDIR /var/www/html

# Copiar el código fuente
COPY . .

# Copiar los assets compilados desde el stage de Node
COPY --from=node-build /app/public/build /var/www/html/public/build

# Configurar variables de Composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Instalar dependencias PHP de Laravel (sin las de desarrollo y optimizando el autoloader)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copiar configuraciones para Nginx, Supervisor y el Entrypoint
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Otorgar permisos de ejecución y ajustar dueños de almacenamiento/caché para Laravel
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Puerto expuesto para Render
EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]