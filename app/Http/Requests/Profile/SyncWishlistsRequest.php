<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class SyncWishlistsRequest extends FormRequest
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
            'lista_ids' => 'array',
            'lista_ids.*' => 'exists:usuario_listas,id'
        ];
    }
}
