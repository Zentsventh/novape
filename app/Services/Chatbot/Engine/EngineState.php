<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Engine;

class EngineState
{
    public array $messages;

    public ?array $pendingToolCall;

    public array $pendingToolCalls = [];

    public ?string $finalResponse;

    public ?string $errorMessage;

    public int $iteration;

    public int $maxIterations;

    public function __construct(array $initialMessages, int $maxIterations = 5)
    {
        $this->messages = $initialMessages;
        $this->pendingToolCall = null;
        $this->finalResponse = null;
        $this->errorMessage = null;
        $this->iteration = 0;
        $this->maxIterations = $maxIterations;
    }

    public function addMessage(array $message): void
    {
        $this->messages[] = $message;
    }
}
