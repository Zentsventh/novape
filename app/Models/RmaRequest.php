<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RmaRequest extends Model
{
    public function getImagesAttribute($value): array
    {
        $images = json_decode($value ?? '[]', true) ?: [];
        return array_map(fn ($image, $index) => str_starts_with($image, 'private:')
            ? route('rma.evidence', ['rmaId' => $this->id, 'index' => $index]) : $image,
            $images, array_keys($images));
    }
    protected $fillable = [
        'usuario_id',
        'pedido_id',
        'producto_id',
        'type',
        'status',
        'reason',
        'description',
        'images',
        'admin_notes',
        'request_key', 'guest_email', 'policy_snapshot',
    ];

    protected $casts = [
        'images' => 'array',
        'policy_snapshot' => 'array',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /** @return HasMany<RmaItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(RmaItem::class);
    }

    /** @return BelongsTo<Pedido, $this> */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    /** @return BelongsTo<Producto, $this> */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
