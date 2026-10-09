<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $id = $this->route('marca') ?? $this->route('id');
        return [
            'nombre' => 'required|string|max:100|unique:marca,nombre,' . $id,
        ];
    }
}
