<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

final class PublicWebhookUrl
{
    /** Validate every resolved address and pin the connection to one of them. */
    public static function resolve(string $url): array
    {
        $parts = parse_url($url);
        if (! $parts || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host']) ||
            isset($parts['user']) || isset($parts['pass']) || ($parts['port'] ?? 443) !== 443) {
            throw new \InvalidArgumentException('El webhook debe usar HTTPS público en el puerto 443, sin credenciales.');
        }
        $host = trim($parts['host'], '[]');
        $addresses = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : app(WebhookDnsResolver::class)->addresses($host);
        if (! $addresses) {
            throw new \InvalidArgumentException('El dominio del webhook no resuelve a una dirección pública.');
        }
        foreach ($addresses as $address) {
            if (! filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) ||
                str_starts_with(strtolower($address), '::ffff:')) {
                throw new \InvalidArgumentException('No se permiten webhooks a redes privadas, locales o reservadas.');
            }
        }

        return [$host, str_contains($addresses[0], ':') ? '['.$addresses[0].']' : $addresses[0]];
    }
}
