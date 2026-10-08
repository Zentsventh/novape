<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

final class PageContent
{
    public const PAGES = [
        'nosotros' => 'Quiénes somos',
        'trabaja-con-nosotros' => 'Trabaja con nosotros',
        'terminos' => 'Términos y condiciones',
        'privacidad' => 'Políticas de privacidad',
        'ayuda' => 'Centro de ayuda',
        'devoluciones' => 'Devoluciones',
        'faq' => 'Preguntas frecuentes',
    ];

    private readonly HtmlSanitizer $sanitizer;

    public function __construct()
    {
        $config = (new HtmlSanitizerConfig())
            ->allowLinkSchemes(['https', 'http', 'mailto', 'tel'])
            ->allowRelativeLinks()
            ->allowElement('a', ['href', 'title'])
            ->forceAttribute('a', 'rel', 'noopener noreferrer');
        foreach (['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'div', 'span'] as $element) {
            $config = $config->allowElement($element);
        }
        $this->sanitizer = new HtmlSanitizer($config);
    }

    /** @return list<array{heading: string, body: string}> */
    public function sanitizeSections(?array $sections): array
    {
        $safe = [];
        foreach ($sections ?? [] as $section) {
            if (!is_array($section) || !is_string($section['heading'] ?? null) || !is_string($section['body'] ?? null)) {
                continue;
            }
            $safe[] = ['heading' => $section['heading'], 'body' => $this->sanitizer->sanitize($section['body'])];
        }
        return $safe;
    }
}
