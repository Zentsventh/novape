<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Storefront\StorefrontService;

class SitemapController extends Controller
{
    public function __construct(
        private readonly StorefrontService $storefrontService
    ) {}

    public function index()
    {
        $xml = \Illuminate\Support\Facades\Cache::remember('store_sitemap_v2_'.sha1(url('/')), 300, fn () => $this->storefrontService->generateSitemapXml());
        return response($xml)->header('Content-Type', 'text/xml');
    }
}
