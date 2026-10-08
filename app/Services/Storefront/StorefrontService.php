<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Models\Producto;
use App\Models\Categoria;
use Carbon\Carbon;

class StorefrontService
{
    public function generateSitemapXml(): string
    {
        $productos = Producto::where('activo', 1)->get(['id', 'slug', 'updated_at']);
        $categorias = Categoria::where('activa', true)->get(['id', 'nombre', 'updated_at']);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        $xml .= $this->createUrlNode(url('/'), Carbon::now()->toAtomString(), '1.0', 'daily');

        $staticPages = ['/catalogo', '/nosotros', '/terminos', '/privacidad', '/devoluciones', '/faq'];
        foreach ($staticPages as $page) {
            $xml .= $this->createUrlNode(url($page), Carbon::now()->toAtomString(), '0.8', 'weekly');
        }

        foreach ($categorias as $categoria) {
            $url = url('/catalogo?categoria=' . urlencode($categoria->nombre));
            $xml .= $this->createUrlNode($url, $categoria->updated_at ? $categoria->updated_at->toAtomString() : Carbon::now()->toAtomString(), '0.9', 'weekly');
        }

        foreach ($productos as $producto) {
            $url = url('/producto/' . ($producto->slug ? $producto->slug : $producto->id));
            $xml .= $this->createUrlNode($url, $producto->updated_at ? $producto->updated_at->toAtomString() : Carbon::now()->toAtomString(), '0.8', 'daily');
        }

        $xml .= '</urlset>';

        return $xml;
    }

    private function createUrlNode(string $loc, string $lastmod, string $priority, string $changefreq): string
    {
        return '<url>' .
            '<loc>' . htmlspecialchars($loc) . '</loc>' .
            '<lastmod>' . $lastmod . '</lastmod>' .
            '<changefreq>' . $changefreq . '</changefreq>' .
            '<priority>' . $priority . '</priority>' .
        '</url>';
    }
}
