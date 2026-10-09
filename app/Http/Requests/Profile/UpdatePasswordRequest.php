<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'password' => ['required', Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised(), 'confirmed'],
        ];

        if ($this->user()->has_set_password) {
            $rules['current_password'] = ['required'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial (@$!%*#?&).'
        ];
    }
}
