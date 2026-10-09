<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Omnichannel\OmnichannelConversation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesAppointment extends Model
{
    public const STATUSES = ['confirmed', 'cancelled', 'completed', 'no_show'];

    protected $fillable = [
        'conversation_id', 'contact_id', 'seller_id', 'crm_activity_id', 'request_id', 'request_fingerprint',
        'customer_name', 'phone', 'email', 'company', 'interest', 'quantity', 'estimated_amount',
        'starts_at', 'ends_at', 'timezone', 'status', 'consented_at', 'notes', 'cancellation_reason', 'updated_by',
    ];

    protected $hidden = ['request_fingerprint'];

    protected $casts = [
        'starts_at' => 'datetime', 'ends_at' => 'datetime', 'consented_at' => 'datetime',
        'estimated_amount' => 'decimal:2', 'quantity' => 'integer',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'seller_id');
    }

    /** @return BelongsTo<OmnichannelConversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(OmnichannelConversation::class, 'conversation_id');
    }

    /** @return BelongsTo<CrmActivity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(CrmActivity::class, 'crm_activity_id');
    }
}
