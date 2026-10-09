<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRmaStatusRequest extends FormRequest
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
            'estado' => 'required|string|in:solicitado,aprobado,rechazado,completado',
            'comentarios_admin' => 'nullable|string|max:1000'
        ];
    }
}
