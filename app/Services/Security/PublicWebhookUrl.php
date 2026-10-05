<?php

declare(strict_types=1);

namespace App\Services\Security;

use Illuminate\Validation\ValidationException;

final class PublicWebhookUrl
{
    public static function validate(string $url): array
    {
        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');
        if (($parts['scheme'] ?? '') !== 'https' || ! $host || isset($parts['user']) || isset($parts['pass']) || ($parts['port'] ?? 443) !== 443) {
            throw ValidationException::withMessages(['url' => 'El webhook requiere HTTPS público en el puerto 443, sin credenciales en la URL.']);
        }
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : array_merge(
            array_column(dns_get_record($host, DNS_A) ?: [], 'ip'),
            array_column(dns_get_record($host, DNS_AAAA) ?: [], 'ipv6')
        );
        if (! $ips) {
            throw ValidationException::withMessages(['url' => 'El dominio del webhook no resuelve a una dirección pública.']);
        }
        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) || str_starts_with(strtolower($ip), '::ffff:')) {
                throw ValidationException::withMessages(['url' => 'Los webhooks no pueden acceder a redes internas o reservadas.']);
            }
        }

        return [$host, $ips];
    }
}
