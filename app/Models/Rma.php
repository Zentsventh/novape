<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rma extends Model
{
    use HasFactory;

    protected $table = 'rma';

    protected $fillable = [
        'pedido_item_id',
        'estado',
        'motivo',
    ];
}
