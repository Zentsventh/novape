<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Omnichannel;

use App\Http\Controllers\Controller;
use App\Models\Omnichannel\OmnichannelChannel;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Omnichannel\ChatbotConfig;
use App\Services\Omnichannel\WhatsAppMediaService;
use App\Services\Omnichannel\WhatsAppService;
use App\Events\Omnichannel\NewMessageReceived;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\MessageStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    protected WhatsAppService $whatsapp;
    protected WhatsAppMediaService $mediaService;

    public function __construct(WhatsAppService $whatsapp, WhatsAppMediaService $mediaService)
    {
        $this->whatsapp = $whatsapp;
        $this->mediaService = $mediaService;
    }

    /**
     * Verificación del Webhook (GET) — Meta envía esto al configurar el webhook.
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode && $token) {
            if ($mode === 'subscribe' && $token === \App\Models\ConfiguracionSitio::obtener('whatsapp_verify_token', config('omnichannel.whatsapp.verify_token'))) {
                Log::info('OMNICHANNEL_WHATSAPP_WEBHOOK_VERIFIED');
                return response($challenge, 200)->header('Content-Type', 'text/plain');
            }
            return response('Forbidden', 403);
        }
        return response('Bad Request', 400);
    }

    /**
     * Recepción de mensajes y eventos (POST).
     * Verifica la firma X-Hub-Signature-256 de Meta cuando app_secret está configurado.
     */
    public function handle(Request $request)
    {
        // Verificar firma de Meta (seguridad)
        $appSecret = \App\Models\ConfiguracionSitio::obtener('whatsapp_app_secret', config('omnichannel.whatsapp.app_secret'));
        if ($appSecret) {
            $signature = $request->header('X-Hub-Signature-256', '');
            $expectedSignature = 'sha256=' . hash_hmac('sha256', $request->getContent(), $appSecret);
            if (!hash_equals($expectedSignature, $signature)) {
                Log::warning('OMNICHANNEL_WHATSAPP_INVALID_SIGNATURE', [
                    'received' => $signature,
                ]);
                return response('Unauthorized', 401);
            }
        }

        $body = $request->all();
        Log::debug('OMNICHANNEL_WHATSAPP_WEBHOOK', ['body' => $body]);

        if (!isset($body['object']) || $body['object'] !== 'whatsapp_business_account') {
            return response('Not Found', 404);
        }

        foreach ($body['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $value = $change['value'] ?? [];
                
                // Enviar TODO el payload al Job para que se procese asíncronamente
                \App\Jobs\Omnichannel\ProcessIncomingWebhookJob::dispatch($change);
            }
        }

        return response('EVENT_RECEIVED', 200);
    }
}
