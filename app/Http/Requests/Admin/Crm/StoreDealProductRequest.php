<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDealProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'producto_id' => 'required|exists:producto,id',
            'variante_id' => 'required|exists:variante,id',
            'cantidad' => 'required|integer|min:1',
        ];
    }
}
