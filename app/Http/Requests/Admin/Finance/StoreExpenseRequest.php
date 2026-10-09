<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Finance;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'concepto' => 'required|string|max:255',
            'monto' => 'required|numeric|min:0',
            'categoria' => 'required|string',
            'tipo' => 'required|in:fijo,variable',
            'fecha_gasto' => 'required|date',
        ];
    }
}
