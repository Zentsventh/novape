<?php

declare(strict_types=1);

namespace App\Services\Api;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DocumentApiService
{
    public function consultar(string $tipo, string $numero): array
    {
        if (! in_array($tipo, ['DNI', 'RUC'], true)
            || ! preg_match($tipo === 'DNI' ? '/^\d{8}$/' : '/^\d{11}$/', $numero)) {
            return ['success' => false, 'message' => 'Documento inválido.'];
        }
        $token = config('services.apiperu.token');
        $url = config('services.apiperu.document_url');
        if (! $token || ! $url || $token === 'SIMULACION_TOKEN') {
            return ['success' => false, 'message' => 'La consulta de documentos no está configurada. Ingrese los datos manualmente.'];
        }

        try {
            $endpoint = rtrim($url, '/').'/'.strtolower($tipo).'/'.$numero;

            $response = Http::withToken($token)
                ->withHeaders(['Accept' => 'application/json'])
                ->connectTimeout(5)->timeout(15)->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                if (is_array($data) && ($data['success'] ?? false) === true && is_array($data['data'] ?? null)) {
                    return $data;
                }
            }

            return ['success' => false, 'message' => 'No se pudo verificar el documento. Ingrese los datos manualmente.'];

        } catch (\Exception $e) {
            Log::warning('No se pudo consultar el proveedor de documentos.', ['exception' => $e::class]);

            return ['success' => false, 'message' => 'No se pudo verificar el documento. Ingrese los datos manualmente.'];
        }
    }
}
