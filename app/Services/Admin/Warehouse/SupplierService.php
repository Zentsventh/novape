<?php

declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

use App\Models\Proveedor;
use Illuminate\Pagination\LengthAwarePaginator;

class SupplierService
{
    public function getSuppliers(array $filters): LengthAwarePaginator
    {
        $query = Proveedor::query();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('nombre', 'like', "%{$search}%")
                ->orWhere('ruc', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        }

        $sort = in_array($filters['sort'] ?? '', ['id', 'nombre', 'ruc', 'email', 'created_at'], true) ? $filters['sort'] : 'id';
        $direction = in_array($filters['direction'] ?? '', ['asc', 'desc'], true) ? $filters['direction'] : 'desc';

        return $query->orderBy($sort, $direction)->paginate(10);
    }

    public function createSupplier(array $data): Proveedor
    {
        return Proveedor::create($data);
    }

    public function updateSupplier(Proveedor $proveedor, array $data): Proveedor
    {
        $proveedor->update($data);

        return $proveedor;
    }

    public function deleteSupplier(Proveedor $proveedor): void
    {
        $proveedor->delete();
    }
}
