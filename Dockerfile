# ==============================================================================
# Stage 1: Build Frontend Assets (Vite + React)
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Cache node dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files needed for compilation
COPY resources ./resources
COPY public ./public
COPY vite.config.js ./
COPY tailwind.config.js* ./
COPY postcss.config.js* ./
COPY jsconfig.json* ./

# Build production assets (outputs to public/build)
RUN npm run build

# ==============================================================================
# Stage 2: Production PHP Runtime (Apache + PHP 8.3)
# ==============================================================================
FROM php:8.3-apache AS production

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
ENV PORT=80

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    libxml2-dev \
    libonig-dev \
    zip \
    unzip \
    default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        zip \
        intl \
        bcmath \
        opcache \
        pcntl \
        exif \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Configure Apache
RUN a2enmod rewrite headers
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/php.ini $PHP_INI_DIR/conf.d/custom-production.ini

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Copy compiled frontend from frontend-builder stage
COPY --from=frontend-builder /app/public/build ./public/build

# Install PHP production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --ignore-platform-reqs

# Setup directory permissions
RUN mkdir -p storage/framework/cache/data \
             storage/framework/sessions \
             storage/framework/views \
             storage/logs \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
