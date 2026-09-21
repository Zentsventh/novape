<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Foundation\Http\FormRequest;

class StoreCrmDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => 'required|string|max:255',
            'valor' => 'nullable|numeric|min:0',
            'empresa_id' => 'nullable|exists:crm_companies,id',
            'usuario_id' => 'nullable|exists:usuario,id', // Persona asociada
            'stage_id' => 'required|exists:crm_stages,id',
            'fecha_cierre_esperada' => 'nullable|date',
            'estado' => 'nullable|in:open,won,lost'
        ];
    }
}
