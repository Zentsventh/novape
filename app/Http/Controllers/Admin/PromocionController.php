<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promocion;
use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PromocionController extends Controller
{
    public function index()
    {
        $promociones = Promocion::withCount('productos')->orderBy('id', 'desc')->get();
        return Inertia::render('Admin/Promociones/Index', [
            'promociones' => $promociones
        ]);
    }

    public function create()
    {
        $productos = Producto::select('id', 'nombre')->orderBy('nombre')->get();
        return Inertia::render('Admin/Promociones/Form', [
            'productos' => $productos,
            'promocion' => null
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo_descuento' => 'required|in:porcentaje,fijo',
            'valor_descuento' => 'required|numeric|min:0|max:'.($request->input('tipo_descuento') === 'porcentaje' ? '100' : '100000'),
            'combinable_coupon'=>'sometimes|boolean',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'activa' => 'boolean',
            'productos' => 'array',
            'productos.*' => 'integer|exists:producto,id'
        ]);

        DB::transaction(function () use ($data) {
            $promocion = Promocion::create([
                'nombre' => $data['nombre'],
                'tipo_descuento' => $data['tipo_descuento'],
                'valor_descuento' => $data['valor_descuento'],
                'combinable_coupon'=>$data['combinable_coupon'] ?? false,
                'fecha_inicio' => $data['fecha_inicio'] ?? null,
                'fecha_fin' => $data['fecha_fin'] ?? null,
                'activa' => $data['activa'] ?? true,
            ]);

            if (!empty($data['productos'])) {
                $promocion->productos()->sync($data['productos']);
            }
        });

        return redirect()->route('promociones.index')->with('success', 'Promoción creada correctamente.');
    }

    public function edit(Promocion $promocion)
    {
        $promocion->load('productos:id');
        $productos = Producto::select('id', 'nombre')->orderBy('nombre')->get();

        return Inertia::render('Admin/Promociones/Form', [
            'productos' => $productos,
            'promocion' => $promocion
        ]);
    }

    public function update(Request $request, Promocion $promocion)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo_descuento' => 'required|in:porcentaje,fijo',
            'valor_descuento' => 'required|numeric|min:0|max:'.($request->input('tipo_descuento') === 'porcentaje' ? '100' : '100000'),
            'combinable_coupon'=>'sometimes|boolean',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'activa' => 'boolean',
            'productos' => 'array',
            'productos.*' => 'integer|exists:producto,id'
        ]);

        DB::transaction(function () use ($data, $promocion) {
            $promocion->update([
                'nombre' => $data['nombre'],
                'tipo_descuento' => $data['tipo_descuento'],
                'valor_descuento' => $data['valor_descuento'],
                'combinable_coupon'=>$data['combinable_coupon'] ?? false,
                'fecha_inicio' => $data['fecha_inicio'] ?? null,
                'fecha_fin' => $data['fecha_fin'] ?? null,
                'activa' => $data['activa'] ?? true,
            ]);

            if (isset($data['productos'])) {
                $promocion->productos()->sync($data['productos']);
            } else {
                $promocion->productos()->sync([]);
            }
        });

        return redirect()->route('promociones.index')->with('success', 'Promoción actualizada correctamente.');
    }

    public function destroy(Promocion $promocion)
    {
        $promocion->delete();
        return redirect()->route('promociones.index')->with('success', 'Promoción eliminada correctamente.');
    }
}
