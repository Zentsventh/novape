<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'estado' => 'required|string|in:pendiente,pagado,procesando,enviado,completado,cancelado',
            'tracking_number' => 'nullable|string|max:100',
            'fulfillment_reference' => 'nullable|string|max:255',
            'courier_name' => 'nullable|string|max:100',
            'estado_envio' => 'nullable|string|in:Preparando,Enviado,Entregado,Listo para recoger,Recogido',
        ];
    }
}
