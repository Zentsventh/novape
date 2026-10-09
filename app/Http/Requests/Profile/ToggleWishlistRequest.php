<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class ToggleWishlistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \Illuminate\Support\Facades\Auth::check();
    }

    /**
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'producto_id' => 'required|exists:producto,id',
            'lista_id' => 'nullable|exists:usuario_listas,id'
        ];
    }
}
