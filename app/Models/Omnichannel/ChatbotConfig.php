<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use Illuminate\Database\Eloquent\Model;

class ChatbotConfig extends Model
{
    protected $table = 'omnichannel_chatbot_config';

    protected $fillable = [
        'bot_name', 'system_prompt', 'business_hours', 'faqs',
        'custom_instructions', 'welcome_message', 'out_of_hours_message',
        'bot_paused_message', 'is_bot_active', 'max_context_messages', 'ai_temperature',
    ];

    protected $casts = [
        'business_hours' => 'json',
        'faqs' => 'json',
        'is_bot_active' => 'boolean',
    ];
}
