<?php

declare(strict_types=1);

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class RemoveCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'variante_id' => 'nullable|integer|min:1',
            'producto_id' => ['required', 'integer']
        ];
    }
}
