<?php

declare(strict_types=1);

namespace App\Http\Requests\Chatbot;

use Illuminate\Foundation\Http\FormRequest;

class ChatbotMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Any visitor can use the chatbot
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'messages' => 'required|array|min:1|max:40',
            'messages.*.role' => 'required|string|in:user,model,bot',
            'messages.*.text' => 'required|string|max:4000',
        ];
    }
}
