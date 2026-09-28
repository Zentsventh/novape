<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WhatsAppMediaService
{
    public function downloadAndStoreMedia(string $mediaId, string $accessToken, string $mimeType): ?string
    {
        try {
            // 1. Obtener la URL real del media
            $metaResponse = Http::withoutVerifying()->withToken($accessToken)
                ->get("https://graph.facebook.com/v21.0/{$mediaId}");

            if (!$metaResponse->successful()) {
                Log::error('WA_MEDIA_META_ERROR', ['media_id' => $mediaId, 'response' => $metaResponse->json()]);
                return null;
            }

            $mediaUrl = $metaResponse->json('url');
            if (!$mediaUrl) return null;

            // 2. Descargar el archivo binario
            $fileResponse = Http::withoutVerifying()->withToken($accessToken)->get($mediaUrl);
            if (!$fileResponse->successful()) {
                Log::error('WA_MEDIA_DOWNLOAD_ERROR', ['media_id' => $mediaId]);
                return null;
            }

            // 3. Determinar extensión y guardar
            $extension = $this->getExtensionFromMime($mimeType);
            $filename = 'omnichannel/media/' . date('Y/m/') . Str::uuid() . '.' . $extension;

            $disk = config('filesystems.default', 'public');
            Storage::disk($disk)->put($filename, $fileResponse->body());

            return Storage::disk($disk)->url($filename);
        } catch (\Exception $e) {
            Log::error('WA_MEDIA_EXCEPTION', ['media_id' => $mediaId, 'error' => $e->getMessage()]);
            return null;
        }
    }

    private function getExtensionFromMime(string $mimeType): string
    {
        return match (true) {
            str_contains($mimeType, 'jpeg'), str_contains($mimeType, 'jpg') => 'jpg',
            str_contains($mimeType, 'png') => 'png',
            str_contains($mimeType, 'webp') => 'webp',
            str_contains($mimeType, 'gif') => 'gif',
            str_contains($mimeType, 'mp4') => 'mp4',
            str_contains($mimeType, 'ogg') => 'ogg',
            str_contains($mimeType, 'opus') => 'opus',
            str_contains($mimeType, 'mpeg') => 'mp3',
            str_contains($mimeType, 'pdf') => 'pdf',
            default => 'bin',
        };
    }
}
