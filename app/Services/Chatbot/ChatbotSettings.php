<?php

namespace App\Services\Chatbot;

use Illuminate\Support\Facades\DB;

class ChatbotSettings
{
    public function get(): array
    {
        $stored = DB::table('chatbot_settings')->where('id', 1)->value('settings');

        return array_replace(config('chatbot'), $stored ? json_decode($stored, true, 512, JSON_THROW_ON_ERROR) : []);
    }

    public function save(array $settings): void
    {
        DB::table('chatbot_settings')->updateOrInsert(['id' => 1], [
            'settings' => json_encode($settings, JSON_THROW_ON_ERROR), 'updated_at' => now(), 'created_at' => now(),
        ]);
    }
}
