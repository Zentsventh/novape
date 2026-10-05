<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Finance;

use Illuminate\Foundation\Http\FormRequest;

class OpenCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'caja_id' => 'required|integer|exists:cajas,id',
            'monto_inicial' => 'required|numeric|min:0',
        ];
    }
}
