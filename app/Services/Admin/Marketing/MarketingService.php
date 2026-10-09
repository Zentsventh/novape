<?php

declare(strict_types=1);

namespace App\Services\Admin\Marketing;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use App\Models\Cupon;
use Illuminate\Http\UploadedFile;

class MarketingService
{
    public function getBanners()
    {
        return DB::table('banners')->orderBy('orden', 'asc')->get();
    }

    public function createBanner(array $data, ?UploadedFile $imagen): void
    {
        $imagenUrl = '';
        if ($imagen) {
            $filename = time() . '_' . $imagen->getClientOriginalName();
            $disk = config('filesystems.default', 'public');
            if ($disk === 'azure') {
                $path = \Illuminate\Support\Facades\Storage::disk('azure')->putFileAs('banners', $imagen, $filename);
                $imagenUrl = \Illuminate\Support\Facades\Storage::disk('azure')->url($path);
            } else {
                $path = public_path('images/banners');
                if (!File::exists($path)) {
                    File::makeDirectory($path, 0755, true);
                }
                $imagen->move($path, $filename);
                $imagenUrl = '/images/banners/' . $filename;
            }
        }

        $posicion = $data['posicion'] ?? 'hero';
        $orden = DB::table('banners')->where('posicion', $posicion)->max('orden') + 1;

        DB::table('banners')->insert([
            'titulo' => $data['titulo'],
            'subtitulo' => $data['subtitulo'] ?? null,
            'imagen_url' => $imagenUrl,
            'enlace_url' => $data['enlace_url'] ?? null,
            'posicion' => $posicion,
            'orden' => $orden,
            'activo' => true,
            'fecha_inicio' => $data['fecha_inicio'] ?? null,
            'fecha_fin' => $data['fecha_fin'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        \Illuminate\Support\Facades\Cache::forget('home_banners');
    }

    public function updateBanner(int $id, array $data, ?UploadedFile $imagen = null): void
    {
        if (isset($data['activo']) && !isset($data['titulo'])) {
            DB::table('banners')->where('id', $id)->update([
                'activo' => $data['activo'],
                'updated_at' => now(),
            ]);
            \Illuminate\Support\Facades\Cache::forget('home_banners');
            return;
        }

        $updateData = [
            'titulo' => $data['titulo'],
            'subtitulo' => $data['subtitulo'] ?? null,
            'enlace_url' => $data['enlace_url'] ?? null,
            'posicion' => $data['posicion'] ?? 'hero',
            'fecha_inicio' => $data['fecha_inicio'] ?? null,
            'fecha_fin' => $data['fecha_fin'] ?? null,
            'updated_at' => now(),
        ];

        if ($imagen) {
            $filename = time() . '_' . $imagen->getClientOriginalName();
            $disk = config('filesystems.default', 'public');
            if ($disk === 'azure') {
                $path = \Illuminate\Support\Facades\Storage::disk('azure')->putFileAs('banners', $imagen, $filename);
                $updateData['imagen_url'] = \Illuminate\Support\Facades\Storage::disk('azure')->url($path);
            } else {
                $path = public_path('images/banners');
                if (!File::exists($path)) {
                    File::makeDirectory($path, 0755, true);
                }
                $imagen->move($path, $filename);
                $updateData['imagen_url'] = '/images/banners/' . $filename;
            }
        }

        DB::table('banners')->where('id', $id)->update($updateData);
        \Illuminate\Support\Facades\Cache::forget('home_banners');
    }

    public function deleteBanner(int $id): void
    {
        DB::table('banners')->where('id', $id)->delete();
        \Illuminate\Support\Facades\Cache::forget('home_banners');
    }

    public function getCoupons()
    {
        return Cupon::orderBy('id', 'desc')->get();
    }

    public function createCoupon(array $data): Cupon
    {
        return Cupon::create($data);
    }

    public function updateCoupon(Cupon $cupon, array $data): Cupon
    {
        $cupon->update($data);
        return $cupon;
    }

    public function deleteCoupon(Cupon $cupon): void
    {
        $cupon->delete();
    }
}
