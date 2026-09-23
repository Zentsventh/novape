<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Illuminate\Support\Facades\Queue;
use App\Jobs\Omnichannel\ProcessIncomingWebhookJob;

class WhatsAppWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_whatsapp_webhook_dispatches_job()
    {
        Queue::fake();

        $response = $this->postJson('/api/webhooks/whatsapp', [
            'object' => 'whatsapp_business_account',
            'entry' => [
                [
                    'id' => '123',
                    'changes' => [
                        [
                            'field' => 'messages',
                            'value' => [
                                'messaging_product' => 'whatsapp',
                                'metadata' => ['phone_number_id' => '123'],
                                'contacts' => [['profile' => ['name' => 'Tester']]],
                                'messages' => [
                                    [
                                        'from' => '1234567890',
                                        'id' => 'wamid.123',
                                        'type' => 'text',
                                        'text' => ['body' => 'Hola']
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]);

        $response->assertStatus(200);

        Queue::assertPushed(ProcessIncomingWebhookJob::class);
    }
}
