<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $apiUrl;

    protected $apiKey;

    protected $sessionName;

    public function __construct()
    {
        $this->apiUrl = rtrim(config('services.openwa.url', ''), '/');
        $this->apiKey = config('services.openwa.key', '');
        $this->sessionName = config('services.openwa.session', 'default');
    }

    /**
     * Obtiene el ID interno de la sesión de OpenWA a partir de su nombre.
     * Si no lo encuentra, retorna el nombre directamente (para compatibilidad).
     */
    protected function getSessionId(): ?string
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Accept' => 'application/json',
            ])->connectTimeout(5)->timeout(15)->get("{$this->apiUrl}/api/sessions");

            if ($response->successful()) {
                $sessions = $response->json();

                if (! is_iterable($sessions)) {
                    return null;
                }

                foreach ($sessions as $session) {
                    if (isset($session['name']) && $session['name'] === $this->sessionName) {
                        return $session['id'];
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('No se pudo obtener el ID de sesión OpenWA: '.$e->getMessage());
        }

        // Fallback: usar el nombre directamente
        return $this->sessionName;
    }

    /**
     * Envía un mensaje de texto vía OpenWA.
     *
     * @param  string  $phone  El número telefónico destino (Ej: 51999999999)
     * @param  string  $message  El mensaje a enviar
     * @return bool True si se envió correctamente, False en caso de error
     */
    public function sendText(string $phone, string $message): bool
    {
        if (empty($this->apiUrl)) {
            Log::warning('OpenWA: URL no configurada, se omitió el mensaje de WhatsApp.');

            return false;
        }

        // Limpiar el número de teléfono para que solo tenga dígitos
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (! preg_match('/^\d{9,15}$/', $cleanPhone)) {
            return false;
        }

        // Asegurar que el número tenga código de país (51 para Perú)
        if (strlen($cleanPhone) <= 9) {
            $cleanPhone = '51'.$cleanPhone;
        }

        // Formato requerido por OpenWA/Baileys (@c.us para contactos)
        $chatId = $cleanPhone.'@c.us';

        // Obtener el ID de sesión
        $sessionId = $this->getSessionId();

        try {
            // Endpoint correcto de OpenWA: /api/sessions/{sessionId}/messages/send-text
            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->connectTimeout(5)->timeout(15)->post("{$this->apiUrl}/api/sessions/{$sessionId}/messages/send-text", [
                'chatId' => $chatId,
                'text' => $message,
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp enviado exitosamente a {$cleanPhone}.");

                return true;
            }

            Log::error("Fallo al enviar WhatsApp a {$cleanPhone}. Status: {$response->status()} Respuesta: ".$response->body());

            return false;

        } catch (\Exception $e) {
            Log::error("Excepción al intentar enviar WhatsApp a {$cleanPhone}: ".$e->getMessage());

            return false;
        }
    }
}
