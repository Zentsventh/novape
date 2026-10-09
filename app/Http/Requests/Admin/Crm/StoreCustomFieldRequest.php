<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Contracts\Validation\ValidationRule;
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'model_type' => 'required|in:user,deal,company',
            'name' => 'required|string|max:50|regex:/^[a-zA-Z][a-zA-Z0-9_ ]*$/',
            'label' => 'required|string|max:100',
            'type' => 'required|in:text,number,date,boolean,select',
            'options' => 'required_if:type,select|nullable|array|min:1|max:100',
            'options.*' => 'required|string|max:255',
            'required' => 'sometimes|boolean',
        ];
    }
}
