<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Finance\StoreExpenseRequest;
use App\Http\Requests\Admin\Finance\UpdateExpenseRequest;
use App\Services\Admin\Finance\ExpenseTrackingService;
use App\Models\Gasto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class GastoController extends Controller
{
    public function __construct(
        private readonly ExpenseTrackingService $expenseService
    ) {}

    public function index(Request $request)
    {
        $filters = [
            'start_date' => $request->query('start_date', now()->startOfMonth()->toDateString()),
            'end_date' => $request->query('end_date', now()->endOfMonth()->toDateString()),
            'search' => $request->query('search', ''),
            'categoria' => $request->query('categoria', ''),
        ];

        return Inertia::render('Admin/Gastos/Index', [
            'gastos' => $this->expenseService->getExpenses($filters),
            'totalGastos' => $this->expenseService->getTotalExpenses($filters),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
            'filters' => $filters
        ]);
    }

    public function store(StoreExpenseRequest $request)
    {
        $this->expenseService->createExpense($request->validated());
        return redirect()->back()->with('success', 'Gasto registrado correctamente.');
    }

    public function update(UpdateExpenseRequest $request, int $id)
    {
        $this->expenseService->updateExpense(Gasto::findOrFail($id), $request->validated());
        return redirect()->back()->with('success', 'Gasto actualizado correctamente.');
    }

    public function destroy(int $id)
    {
        $this->expenseService->deleteExpense(Gasto::findOrFail($id));
        return redirect()->back()->with('success', 'Gasto eliminado.');
    }
}
