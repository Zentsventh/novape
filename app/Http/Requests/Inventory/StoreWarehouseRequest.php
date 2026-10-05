<?php
namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La política ya protege el endpoint, devolvemos true para permitir la validación
        return true;
    }

    public function rules(): array
    {
        return [
            'code'        => ['required', 'string', 'max:20', 'unique:warehouses,code'],
            'name'        => ['required', 'string', 'max:255'],
            'address'     => ['required', 'string', 'max:255'],
            'city'        => ['required', 'string', 'max:100'],
            'state'       => ['required', 'string', 'max:100'],
            'country'     => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'status'      => ['required', 'in:active,inactive'],
        ];
    }
}
?>
