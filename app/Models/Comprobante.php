<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comprobante extends Model
{
    protected $table = 'comprobantes';

    protected $fillable = [
        'fiscal_environment', 'issuer_tax_id',
        'pedido_id',
        'tipo_comprobante',
        'tipo',
        'serie',
        'numero',
        'codigo_ticket',
        'enlace_pdf',
        'enlace_xml',
        'ruta_pdf',
        'ruta_xml',
        'estado_sunat',
        'hash_cdr',
        'total',
        'igv',
        'operaciones_gravadas',
        'cliente_nombre',
        'cliente_documento',
        'cliente_tipo_documento',
        'fecha_emision',
        'emitido_at',
    ];

    protected $casts = [
        'emitido_at' => 'datetime',
        'total' => 'decimal:2',
        'igv' => 'decimal:2',
        'operaciones_gravadas' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $receipt) {
            $receipt->fiscal_environment ??= config('invoicing.environment', 'sandbox');
            $receipt->issuer_tax_id ??= (string) config('invoicing.company.ruc', 'unconfigured');
        });
    }

    public function pedido(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }
}
