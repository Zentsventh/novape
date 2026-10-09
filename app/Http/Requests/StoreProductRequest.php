<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }



    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:150',
            'marca_id' => 'required|integer|exists:marca,id',
            'proveedor_id' => 'nullable|integer|exists:proveedor,id',
            'sku_base' => 'nullable|string|max:100|unique:producto,sku_base|unique:variante,sku',
            'descripcion' => 'nullable|string',
            'garantias' => 'nullable|string',
            'activo' => 'boolean',
            'precio' => 'required|numeric|min:0',
            'peso_kg' => 'required|numeric|min:0',
            'shipping_length_cm' => 'nullable|numeric|gt:0|max:1000',
            'shipping_width_cm' => 'nullable|numeric|gt:0|max:1000',
            'shipping_height_cm' => 'nullable|numeric|gt:0|max:1000',
            'retiro_tienda' => 'sometimes|boolean',
            'envio_domicilio' => 'sometimes|boolean',
            'categorias' => 'array',
            'categorias.*' => 'integer|exists:categoria,id',
            'imagenes' => 'array',
            // Can be string (URL) or uploaded file
            'imagenes.*' => 'nullable',
            'stock' => 'required|integer|min:0',
            'especificaciones' => 'nullable|array',
            'especificaciones.*.nombre' => 'required|string',
            'especificaciones.*.valor' => 'required|string',
        ];
    }
}
