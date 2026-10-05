<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;
use Illuminate\Pagination\LengthAwarePaginator;

class OrderQueryService
{
    /**
     * Retrieves paginated orders based on filters.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getPaginatedOrders(array $filters): LengthAwarePaginator
    {
        // Select explicitly needed columns for the index view
        $query = Pedido::query()
            ->select([
                'id',
                'codigo',
                'usuario_id',
                'total',
                'estado',
                'created_at'
            ])
            ->with(['usuario' => function ($q) {
                $q->select('id', 'nombres', 'apellidos', 'email');
            }]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                    ->orWhereHas('usuario', function ($u) use ($search) {
                        $u->where('nombres', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['date_start'])) {
            $query->whereDate('created_at', '>=', $filters['date_start']);
        }
        if (!empty($filters['date_end'])) {
            $query->whereDate('created_at', '<=', $filters['date_end']);
        }

        $sort = in_array($filters['sort'] ?? '', ['asc', 'desc']) ? $filters['sort'] : 'desc';
        $query->orderBy('created_at', $sort);

        return $query->paginate(15)->withQueryString();
    }

    public function getOrderForShow(int $id): Pedido
    {
        return Pedido::query()
            ->with([
                'usuario' => fn($q) => $q->select('id', 'nombres', 'apellidos', 'email', 'telefono'),
                'items.variante.producto:id,nombre',
                'envio',
                'pago'
            ])
            ->findOrFail($id);
    }

    public function getOrderForUpdate(int $id): Pedido
    {
        return Pedido::query()->with(['envio', 'items', 'usuario', 'pago'])->findOrFail($id);
    }
    
    public function getOrderForRefund(int $id): Pedido
    {
        return Pedido::query()->with(['pago', 'items', 'usuario'])->findOrFail($id);
    }
    
    public function getOrderForInvoice(int $id): Pedido
    {
        return Pedido::query()->with(['usuario', 'items.variante.producto', 'envio', 'pago'])->findOrFail($id);
    }
}
