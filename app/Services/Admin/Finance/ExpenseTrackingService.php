<?php

declare(strict_types=1);

namespace App\Services\Admin\Finance;

use App\Models\Gasto;
use Illuminate\Pagination\LengthAwarePaginator;

class ExpenseTrackingService
{
    public function getExpenses(array $filters): LengthAwarePaginator
    {
        $query = Gasto::query();

        if (!empty($filters['start_date'])) {
            $query->whereDate('fecha_gasto', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('fecha_gasto', '<=', $filters['end_date']);
        }
        
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('concepto', 'like', "%{$search}%")
                  ->orWhere('monto', 'like', "%{$search}%");
            });
        }
        
        if (!empty($filters['categoria']) && $filters['categoria'] !== 'Todos') {
            $query->where('categoria', $filters['categoria']);
        }

        return $query->orderBy('fecha_gasto', 'desc')->paginate(15);
    }

    public function getTotalExpenses(array $filters): float
    {
        $query = Gasto::query();

        if (!empty($filters['start_date'])) {
            $query->whereDate('fecha_gasto', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('fecha_gasto', '<=', $filters['end_date']);
        }
        
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('concepto', 'like', "%{$search}%")
                  ->orWhere('monto', 'like', "%{$search}%");
            });
        }
        
        if (!empty($filters['categoria']) && $filters['categoria'] !== 'Todos') {
            $query->where('categoria', $filters['categoria']);
        }

        return (float) $query->sum('monto');
    }

    public function createExpense(array $data): Gasto
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $expense = Gasto::create($data);
            \App\Services\Operations\OperationEvents::record('expense.created', 'gastos', $expense->id, ['amount' => $expense->monto, 'business_date' => $expense->fecha_gasto]);
            return $expense;
        });
    }

    public function updateExpense(Gasto $gasto, array $data): Gasto
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($gasto, $data) {
            $before = $gasto->monto;
            $gasto->update($data);
            \App\Services\Operations\OperationEvents::record('expense.updated', 'gastos', $gasto->id, ['before_amount' => $before, 'after_amount' => $gasto->monto, 'business_date' => $gasto->fecha_gasto]);
            return $gasto;
        });
    }

    public function deleteExpense(Gasto $gasto): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($gasto) {
            $gasto->delete();
            \App\Services\Operations\OperationEvents::record('expense.archived', 'gastos', $gasto->id, ['amount' => $gasto->monto]);
        });
    }
}
