<?php
namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policies handle access
    }

    public function rules(): array
    {
        return [
            'product_id'   => ['required', 'uuid', 'exists:products,id'],
            'warehouse_id' => ['required', 'uuid', 'exists:warehouses,id'],
            'quantity'     => ['required', 'integer', 'min:0'],
            'reserved'     => ['required', 'integer', 'min:0'],
            'status'       => ['required', 'in:active,inactive'],
        ];
    }
}
?>
