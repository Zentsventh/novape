<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Crm;

use Illuminate\Foundation\Http\FormRequest;

class ResolveEvidenceRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'action' => 'required|in:accept,reject',
            'model_type' => 'required|in:deal,user',
            'model_id' => 'required|integer',
            'field_name' => 'required|string|max:100',
            'suggested_value' => 'required'
        ];
    }
}
