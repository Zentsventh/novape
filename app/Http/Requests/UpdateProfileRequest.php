<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Ya lo protege el middleware auth
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'tipo_documento' => 'nullable|string|max:20',
            'dni' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date|before_or_equal:today',
            'telefono' => 'nullable|string|max:15',
            'direccion' => 'nullable|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'departamento' => 'nullable|string|max:100',
            'provincia' => 'nullable|string|max:100',
            'distrito' => 'nullable|string|max:100',
            'codigo_postal' => 'nullable|string|max:20',
        ];
    }
}
