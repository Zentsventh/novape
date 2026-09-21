<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomFieldRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Assuming middleware handles general admin auth
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'model_type' => 'required|in:user,deal',
            'name' => 'required|string|max:50',
            'label' => 'required|string|max:100',
            'type' => 'required|in:text,number,date,boolean'
        ];
    }
}
