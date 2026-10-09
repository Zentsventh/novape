<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @php
        $seoProduct = data_get($page, 'props.producto');
        $seoDescription = $seoProduct ? \Illuminate\Support\Str::limit(strip_tags(data_get($seoProduct, 'descripcion') ?: data_get($seoProduct, 'nombre')), 160, '') : 'Novape: tecnología y electrohogar con entrega en Lima Metropolitana. Consulta disponibilidad, modalidades y costo de entrega antes de pagar.';
    @endphp
    <meta name="description" content="{{ $seoDescription }}" inertia="description">
    @if($seoProduct)
        <link rel="canonical" href="{{ data_get($page, 'props.canonicalUrl') }}" inertia="canonical">
        @php
            $productSchema = ['@context' => 'https://schema.org', '@type' => 'Product',
                'name' => data_get($seoProduct, 'nombre'), 'description' => $seoDescription,
                'image' => data_get($seoProduct, 'imagen'), 'url' => data_get($page, 'props.canonicalUrl'),
                'offers' => ['@type' => 'Offer', 'priceCurrency' => 'PEN', 'price' => data_get($seoProduct, 'precio_actual'),
                    'availability' => data_get($seoProduct, 'stock', 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    'url' => data_get($page, 'props.canonicalUrl')]];
            if (data_get($seoProduct, 'marca')) $productSchema['brand'] = ['@type' => 'Brand', 'name' => data_get($seoProduct, 'marca')];
            if (data_get($page, 'props.totalReviews', 0) > 0) $productSchema['aggregateRating'] = ['@type' => 'AggregateRating', 'ratingValue' => data_get($page, 'props.promedioEstrellas'), 'reviewCount' => data_get($page, 'props.totalReviews')];
        @endphp
        <script type="application/ld+json">{!! json_encode($productSchema, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) !!}</script>
    @endif
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'Novape') }}</title>
    <link rel="icon" type="image/png" sizes="48x48" href="{{ asset('images/favicon_novape.png') }}?v={{ file_exists(public_path('images/favicon_novape.png')) ? filemtime(public_path('images/favicon_novape.png')) : '1' }}">
    <link rel="shortcut icon" href="{{ asset('favicon.ico') }}?v={{ file_exists(public_path('favicon.ico')) ? filemtime(public_path('favicon.ico')) : '1' }}">
    <link rel="apple-touch-icon" href="{{ asset('images/favicon_novape.png') }}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Scripts -->
    @routes
    <script>
        window.addEventListener('error', function(event) {
            fetch('/api/log-frontend-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: event.message, stack: event.error ? event.error.stack : null })
            });
        });
        window.addEventListener('unhandledrejection', function(event) {
            fetch('/api/log-frontend-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: event.reason, stack: event.reason ? event.reason.stack : null })
            });
        });
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
