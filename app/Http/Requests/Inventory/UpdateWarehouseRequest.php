<?php
namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policies control access
    }

    public function rules(): array
    {
        return [
            'code'        => ['sometimes', 'string', 'max:20', 'unique:warehouses,code,' . $this->route('warehouse')],
            'name'        => ['sometimes', 'string', 'max:255'],
            'address'     => ['sometimes', 'string', 'max:255'],
            'city'        => ['sometimes', 'string', 'max:100'],
            'state'       => ['sometimes', 'string', 'max:100'],
            'country'     => ['sometimes', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'string', 'max:20'],
            'status'      => ['sometimes', 'in:active,inactive'],
        ];
    }
}
?>
