<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Finance;

use Illuminate\Foundation\Http\FormRequest;

class CashMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'tipo' => 'required|in:ingreso,egreso',
            'monto' => 'required|numeric|min:0.1',
            'concepto' => 'required|string|max:255'
        ];
    }
}
