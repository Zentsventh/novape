<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCrmDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => 'sometimes|required|string|max:255',
            'valor' => 'nullable|numeric|min:0',
            'empresa_id' => 'nullable|exists:crm_companies,id',
            'usuario_id' => 'nullable|exists:usuario,id',
            'stage_id' => 'sometimes|required|exists:crm_stages,id',
            'fecha_cierre_esperada' => 'nullable|date',
            'estado' => 'nullable|in:open,won,lost'
        ];
    }
}
