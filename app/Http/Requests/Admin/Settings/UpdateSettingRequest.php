<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'logo_url' => 'nullable|url|max:500',
            'nombre_sitio' => 'required|string|max:100',
            'pago_tarjeta' => 'boolean',
            'pago_transferencia' => 'boolean',
            'envio_gratis' => 'boolean',
            'igv_porcentaje' => 'required|numeric|min:0|max:100',
            'whatsapp_token' => 'nullable|string',
            'whatsapp_phone_number_id' => 'nullable|string',
            'whatsapp_verify_token' => 'nullable|string',
            'whatsapp_app_secret' => 'nullable|string',
            'seo_title' => 'nullable|string|max:150',
            'seo_description' => 'nullable|string|max:300',
            'seo_keywords' => 'nullable|string|max:300',
        ];
    }
}
