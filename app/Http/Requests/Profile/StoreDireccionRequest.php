<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class StoreDireccionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, string|list<string>>
     */
    public function rules(): array
    {
        return [
            'direccion' => 'required|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'departamento' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
            'distrito' => 'required|string|max:100',
            'codigo_postal' => ['nullable', 'regex:/^[0-9]{5}$/'],
            'principal' => 'nullable|boolean',
        ];
    }
}
