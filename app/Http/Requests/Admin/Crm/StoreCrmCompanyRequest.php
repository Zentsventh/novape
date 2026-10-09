<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Foundation\Http\FormRequest;

class StoreCrmCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'ruc' => 'nullable|string|max:20|unique:crm_companies,ruc',
            'dominio' => 'nullable|string|max:255|unique:crm_companies,dominio',
            'industria' => 'nullable|string|max:100',
            'tamaño' => 'nullable|in:startup,pequeña,mediana,grande,enterprise',
            'sitio_web' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:255',
            'ciudad' => 'nullable|string|max:100',
            'pais' => 'nullable|string|max:100',
            'usuario_responsable_id' => 'nullable|exists:usuario,id',
            'ingresos_anuales' => 'nullable|numeric|min:0',
            'empleados' => 'nullable|integer|min:0',
            'descripcion' => 'nullable|string|max:2000',
        ];
    }
}
