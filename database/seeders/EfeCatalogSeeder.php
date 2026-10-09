<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EfeCatalogSeeder extends Seeder
{
    private array $categories = [];

    public function run(?array $changedSourceUrls = null): void
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('El inventario estimado solo se carga en local/testing.');
        }
        $taxonomy = json_decode(file_get_contents(database_path('seed-data/efe-taxonomy.json')), true, 512, JSON_THROW_ON_ERROR);
        $file = database_path('seed-data/efe-catalog.json');
        $catalog = is_file($file) ? json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR) : [];
        foreach ($catalog as $record) {
            if (count(array_unique($record['image_paths'])) < 3 || $record['price'] <= 0 || $record['currency'] !== 'PEN') {
                throw new \RuntimeException('Ficha sin tres fotografías o precio válido: '.$record['source_url']);
            }
            foreach ($record['image_paths'] as $image) {
                if (!str_starts_with($image, 'productos/efe/') || !is_file(storage_path('app/public/'.$image))) {
                    throw new \RuntimeException('Imagen local no disponible: '.$image);
                }
            }
        }
        DB::transaction(function () use ($taxonomy) {
            $this->categories($taxonomy['categories']);
            DB::table('categoria')->where('fuente_url', 'like', 'https://www.efe.com.pe/%')
                ->whereNotIn('id', array_values($this->categories))->update(['activa' => false]);
            // Archive the old generated navigation, keeping historical relationships intact.
            DB::table('categoria')->whereNull('fuente_url')->update(['activa' => false]);
        });
        $warehouse = (int) DB::table('configuracion_sitio')->where('clave', 'almacen_ecommerce_id')->value('valor');
        if (!$warehouse || !DB::table('almacenes')->where('id', $warehouse)->exists()) {
            throw new \RuntimeException('Configura primero el almacén de ecommerce.');
        }
        $changedSources = $changedSourceUrls === null ? null : array_fill_keys($changedSourceUrls, true);
        foreach ($catalog as $position => $record) {
            if ($changedSources !== null && !isset($changedSources[$record['source_url']])) continue;
            DB::transaction(fn () => $this->product($record, $warehouse));
            if (($position + 1) % 250 === 0) $this->command?->info('Productos importados: '.($position + 1).'/'.count($catalog));
        }
        $bannerPaths = [
            'Celulares' => '/tecnologia/celulares.html', 'TV' => '/tecnologia/televisores.html',
            'Mundo Gamer' => '/tecnologia/gaming.html', 'Cómputo' => '/tecnologia/computacion.html',
            'Refrigeración' => '/electrohogar/refrigeracion.html', 'Lavado' => '/electrohogar/lavado.html',
            'Cocina' => '/electrohogar/cocina.html', 'Electrodomésticos' => '/electrohogar/electrodomesticos.html',
        ];
        foreach (json_decode(file_get_contents(database_path('seed-data/banners-efe.json')), true, 512, JSON_THROW_ON_ERROR) as $banner) {
            $url = 'https://www.efe.com.pe'.($bannerPaths[$banner['categoria']] ?? '');
            if (isset($this->categories[$url])) DB::table('banners')->where('imagen_url', $banner['desktop_url'])
                ->update(['enlace_url' => '/catalogo?categoria_id='.$this->categories[$url]]);
        }
        $coverageFile = database_path('seed-data/efe-coverage.json');
        if (is_file($coverageFile)) {
            $coverage = json_decode(file_get_contents($coverageFile), true, 512, JSON_THROW_ON_ERROR);
            if ($coverage['leaves_processed'] === $coverage['leaves_total'] && $coverage['products_unique'] === count($catalog)) {
                // Retain historical order items while withdrawing superseded demo listings.
                $skus = array_map(fn($record) => 'REAL-'.strtoupper(substr(hash('sha256', $record['source_url']), 0, 16)), $catalog);
                DB::table('producto')->where('sku_base', 'like', 'REAL-%')->whereNotIn('sku_base', $skus)->update(['activo' => false]);
            }
        }
        // These are local catalog responses; invalidate all filter/page combinations too.
        Cache::flush();
        $this->writeImportedSnapshot($catalog);
        $this->command?->info(count($this->categories).' categorías EFE; '.count($catalog).' productos con tres fotografías e inventario mensual estimado.');
    }

    private function writeImportedSnapshot(array $catalog): void
    {
        $path = storage_path('app/private/efe-imported-catalog.json');
        $temporary = $path.'.tmp';
        $handle = fopen($temporary, 'wb');
        if (!$handle) throw new \RuntimeException('No se puede guardar la copia del catálogo importado.');
        try {
            fwrite($handle, "[\n");
            foreach ($catalog as $position => $record) {
                if ($position) fwrite($handle, ",\n");
                $encoded = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
                if (fwrite($handle, $encoded) !== strlen($encoded)) throw new \RuntimeException('No se pudo escribir la ficha importada.');
            }
            fwrite($handle, "\n]\n");
        } finally {
            fclose($handle);
        }
        if (!rename($temporary, $path)) throw new \RuntimeException('No se pudo publicar la copia del catálogo importado.');
    }

    private function put(string $table, array $key, array $values): int
    {
        $existing = DB::table($table)->where($key)->first();
        if ($existing) {
            $changes = [];
            foreach ($values as $field => $value) {
                $actual = $existing->{$field};
                $different = $actual === null || $value === null
                    ? $actual !== $value
                    : ((is_int($value) || is_float($value) || is_bool($value)) ? $actual != $value : (string) $actual !== (string) $value);
                if ($different) $changes[$field] = $value;
            }
            if ($changes) DB::table($table)->where('id', $existing->id)->update([...$changes, 'updated_at' => now()]);
            return (int) $existing->id;
        }
        return (int) DB::table($table)->insertGetId([...$key, ...$values, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function categories(array $nodes, ?int $parent = null): void
    {
        foreach ($nodes as $order => $node) {
            $slug = 'efe-'.substr(Str::slug(trim(parse_url($node['url'], PHP_URL_PATH), '/')), 0, 120).'-'.substr(hash('sha256', $node['url']), 0, 8);
            $id = $this->put('categoria', ['fuente_url' => $node['url']], [
                'nombre' => $node['name'], 'slug' => $slug, 'categoria_padre_id' => $parent,
                'orden' => $order, 'activa' => true, 'deleted_at' => null,
            ]);
            $this->categories[$node['url']] = $id;
            $this->categories($node['children'], $id);
        }
    }

    private function product(array $record, int $warehouse): void
    {
        $sku = 'REAL-'.strtoupper(substr(hash('sha256', $record['source_url']), 0, 16));
        $brand = $this->put('marca', ['nombre' => $record['brand']], ['deleted_at' => null]);
        $product = $this->put('producto', ['sku_base' => $sku], [
            'nombre' => $record['name'], 'slug' => substr(Str::slug($record['name']), 0, 180).'-'.strtolower(substr($sku, -6)),
            'marca_id' => $brand, 'descripcion' => $record['description'], 'garantias' => $record['warranty'],
            'fuente_url' => $record['source_url'], 'fuente_consultada_at' => $record['collected_on'],
            'activo' => true, 'retiro_tienda' => true, 'envio_domicilio' => true, 'deleted_at' => null,
        ]);
        $categoryIds = array_values(array_intersect_key($this->categories, array_flip($record['category_urls'])));
        DB::table('producto_categoria')->where('producto_id', $product)->whereIn('categoria_id', array_values($this->categories))
            ->whereNotIn('categoria_id', $categoryIds)->delete();
        foreach ($record['category_urls'] as $url) {
            if (isset($this->categories[$url])) {
                DB::table('producto_categoria')->updateOrInsert(['producto_id' => $product, 'categoria_id' => $this->categories[$url]], []);
            }
        }
        $demand = $this->monthlyDemand($record);
        $safety = max(1, (int) ceil($demand * 0.25));
        $variant = DB::table('variante')->where('sku', $sku)->lockForUpdate()->first();
        $reserved = (int) ($variant->stock_reservado ?? 0);
        $target = max($reserved, $demand + $safety);
        $variantId = $this->put('variante', ['sku' => $sku], [
            'producto_id' => $product, 'precio' => $record['price'], 'precio_anterior' => $record['previous_price'],
            'precio_compra' => round($record['price'] * 0.72, 2), // Estimate, not an EFE supplier quote.
            'stock_minimo' => max(1, (int) ceil($demand / 4)), 'stock_maximo' => $target * 2, 'stock_seguridad' => $safety,
            'atributos' => json_encode(['modelo' => $record['model']], JSON_UNESCAPED_UNICODE), 'activo' => true, 'deleted_at' => null,
        ]);
        $reference = 'EFE-INVENTARIO-MENSUAL-'.$variantId;
        if (!DB::table('movimientos_almacen')->where('referencia', $reference)->exists()) {
            $current = (int) DB::table('stock_almacen')->where('almacen_id', $warehouse)->where('variante_id', $variantId)->value('cantidad');
            $this->put('stock_almacen', ['almacen_id' => $warehouse, 'variante_id' => $variantId], ['cantidad' => $target]);
            $globalStock = DB::table('stock_almacen')->where('variante_id', $variantId)->sum('cantidad');
            DB::table('variante')->where('id', $variantId)->update(['stock' => $globalStock]);
            DB::table('movimientos_almacen')->insert([
                'almacen_id' => $warehouse, 'variante_id' => $variantId, 'tipo' => $target >= $current ? 'entrada' : 'salida',
                'cantidad' => abs($target - $current), 'referencia' => $reference, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        foreach ($record['image_paths'] as $order => $path) {
            $this->put('producto_imagen', ['producto_id' => $product, 'orden' => $order], ['url' => '/storage/'.$path]);
        }
        $additional = 0;
        $specifications = [];
        foreach ($record['specifications'] as $key => $value) {
            if (mb_strlen($key) > 100) {
                $value = $key.': '.$value;
                $key = 'Información publicada '.(++$additional);
            }
            if ($key !== '') $specifications[$key] = $value;
        }
        DB::table('producto_especificaciones')->where('producto_id', $product)->whereNotIn('clave', array_keys($specifications))->delete();
        foreach ($specifications as $key => $value) $this->put('producto_especificaciones', ['producto_id' => $product, 'clave' => $key], ['valor' => $value]);
    }

    private function monthlyDemand(array $record): int
    {
        $name = Str::lower(Str::ascii($record['name']));
        // One month of estimated turnover per SKU; costly/bulky goods turn more slowly.
        [$minimum, $maximum] = match (true) {
            $record['price'] >= 5000 => [1, 2],
            $record['price'] >= 2500 => [2, 4],
            preg_match('/refriger|lavadora|cocina|mueble|sofa|colchon|motocicleta|motocar|bicicleta/', $name) === 1 => [2, 5],
            $record['price'] >= 1000 => [3, 7],
            $record['price'] >= 300 => [5, 12],
            $record['price'] >= 80 => [8, 20],
            default => [15, 35],
        };
        return $minimum + hexdec(substr(hash('sha256', $record['source_url']), 0, 6)) % ($maximum - $minimum + 1);
    }
}
