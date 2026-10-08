<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Page;
use App\Services\Storefront\PageContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->user()?->tienePermiso('gestionar_ajustes') ?? false;
    }

    public function rules(): array
    {
        $page = $this->route('page');
        return [
            'slug' => ['required', 'string', Rule::in(array_keys(PageContent::PAGES)), Rule::unique('pages', 'slug')->ignore($page instanceof Page ? $page->id : null)],
            'title' => ['required', 'string', 'max:255'],
            'sections' => ['nullable', 'array', 'max:50'],
            'sections.*' => ['required', 'array:heading,body'],
            'sections.*.heading' => ['required', 'string', 'max:255'],
            'sections.*.body' => ['required', 'string', 'max:50000'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
