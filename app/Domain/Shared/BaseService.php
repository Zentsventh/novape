<?php
namespace App\Domain\Shared;

/**
 * Base service class that all domain services can extend.
 * Provides common helpers such as event dispatching and logging.
 */
abstract class BaseService
{
    /**
     * Dispatch a domain event.
     */
    protected function dispatch(object $event): void
    {
        event($event);
    }

    /**
     * Log an informational message.
     */
    protected function logInfo(string $message, array $context = []): void
    {
        \Log::info($message, $context);
    }
}
?>
