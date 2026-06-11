FROM php:8.3-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git unzip zip curl pkg-config \
    libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    libonig-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo pdo_mysql pdo_pgsql mbstring zip exif pcntl gd

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

RUN npm install --legacy-peer-deps \
    && npm run build

RUN php artisan config:cache

RUN chmod -R 777 storage bootstrap/cache

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000