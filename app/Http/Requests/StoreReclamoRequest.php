<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReclamoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Any user (even guests) can create a Reclamo
    }

    /**
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'tipo_documento' => 'required|string|max:50',
            'numero_documento' => 'required|string|max:50',
            'telefono' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'direccion' => 'required|string|max:500',
            'menor_edad' => 'boolean',
            'nombre_apoderado' => 'required_if:menor_edad,true|nullable|string|max:255',
            'bien_contratado' => 'required|string|in:Producto,Servicio',
            'monto_reclamado' => 'required|numeric|min:0',
            'pedido_relacionado' => 'nullable|string|max:255',
            'tipo_reclamo' => 'required|string|in:Reclamo,Queja',
            'detalle' => 'required|string|max:5000',
            'pedido_consumidor' => 'required|string|max:5000'
        ];
    }
}
