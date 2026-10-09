<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

interface ToolInterface
{
    /**
     * Devuelve el nombre de la herramienta.
     */
    public function getName(): string;

    /**
     * Devuelve la descripción de la herramienta para el LLM.
     */
    public function getDescription(): string;

    /**
     * Devuelve el esquema JSON de los parámetros que requiere la herramienta.
     */
    public function getParametersSchema(): array;

    /**
     * Ejecuta la herramienta con los argumentos proporcionados por el LLM.
     */
    public function execute(array $args): mixed;
}
