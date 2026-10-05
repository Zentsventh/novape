<?php

namespace App\Services\Admin\Crm;

class WebhookDnsResolver
{
    public function addresses(string $host): array
    {
        return array_merge(array_column(dns_get_record($host, DNS_A) ?: [], 'ip'),
            array_column(dns_get_record($host, DNS_AAAA) ?: [], 'ipv6'));
    }
}
