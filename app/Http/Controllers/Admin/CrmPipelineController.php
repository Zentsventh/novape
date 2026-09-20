<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmDeal;
use App\Models\CrmPipeline;
use App\Models\CrmStage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrmPipelineController extends Controller
{
    public function index(Request $request)
    {
        $stages = CrmStage::orderBy('orden')->get();
        
        $query = CrmDeal::with(['cliente', 'stage']);

        // Filtros
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                  ->orWhereHas('cliente', function($qc) use ($search) {
                      $qc->where('nombres', 'like', "%{$search}%")
                         ->orWhere('apellidos', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('estado') && $request->input('estado') !== 'all') {
            $query->where('estado', $request->input('estado'));
        }

        // Si no hay filtro de estado explícito, por defecto no mostramos won/lost para no saturar,
        // a menos que se busque algo específico. Para simplificar, si no hay estado, mostramos 'open'.
        if (!$request->filled('estado')) {
            $query->where('estado', 'open');
        }

        $deals = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/CRM/Pipeline', [
            'stages' => $stages,
            'deals' => $deals,
            'filters' => $request->only(['search', 'estado'])
        ]);
    }

    public function moveDeal(Request $request, int $id)
    {
        $request->validate([
            'stage_id' => 'required|exists:crm_stages,id',
            'estado' => 'nullable|string|in:open,won,lost'
        ]);

        $deal = CrmDeal::findOrFail($id);
        
        $oldStageId = $deal->stage_id;
        $oldEstado = $deal->estado;

        $deal->stage_id = $request->input('stage_id');
        
        if ($request->has('estado')) {
            $deal->estado = $request->input('estado');
        }

        // Podríamos actualizar la fecha_cierre_esperada si se mueve a ganado/perdido
        if ($deal->estado === 'won' || $deal->estado === 'lost') {
            $deal->fecha_cierre_esperada = now();
        }

        $deal->save();

        $this->triggerAutomations($deal, $oldStageId, $deal->stage_id, $oldEstado, $deal->estado);

        return redirect()->back()->with('success', 'Deal actualizado correctamente');
    }

    private function triggerAutomations(CrmDeal $deal, $oldStageId, $newStageId, $oldEstado, $newEstado)
    {
        // 1. Trigger de "Negocio Ganado"
        if ($oldEstado !== 'won' && $newEstado === 'won') {
            $deal->activities()->create([
                'usuario_id' => auth()->id() ?? 1, // fallback por si no hay auth en webhook
                'tipo' => 'tarea',
                'contenido' => '🤖 Automatización: Generar orden de compra y enviar correo de bienvenida al cliente.',
                'fecha_vencimiento' => now()->addDay(),
                'completada' => false
            ]);
        }

        // 2. Trigger de "Negocio Perdido"
        if ($oldEstado !== 'lost' && $newEstado === 'lost') {
            $deal->activities()->create([
                'usuario_id' => auth()->id() ?? 1,
                'tipo' => 'tarea',
                'contenido' => '🤖 Automatización: Enviar encuesta de salida para entender los motivos de pérdida.',
                'fecha_vencimiento' => now()->addDays(2),
                'completada' => false
            ]);
        }

        // 3. Trigger de Cambio de Etapa (Ejemplo: Si cambió a cualquier etapa nueva distinta a la anterior)
        if ($oldStageId !== $newStageId && $newEstado === 'open') {
            $stage = \App\Models\CrmStage::find($newStageId);
            if ($stage && (stripos($stage->nombre, 'contacto') !== false || stripos($stage->nombre, 'reunión') !== false)) {
                $deal->activities()->create([
                    'usuario_id' => auth()->id() ?? 1,
                    'tipo' => 'tarea',
                    'contenido' => '🤖 Automatización: Llamar al cliente para agendar/preparar demostración.',
                    'fecha_vencimiento' => now()->addDay(),
                    'completada' => false
                ]);
            }
        }
    }

    public function show(int $id)
    {
        $deal = CrmDeal::with(['cliente', 'stage', 'activities.autor', 'products.producto'])->findOrFail($id);
        return response()->json($deal);
    }

    public function storeActivity(Request $request, int $id)
    {
        $request->validate([
            'tipo' => 'required|string|in:nota,tarea,llamada,email',
            'contenido' => 'required|string',
            'fecha_vencimiento' => 'nullable|date'
        ]);

        $deal = CrmDeal::findOrFail($id);

        $activity = $deal->activities()->create([
            'usuario_id' => auth()->id(),
            'tipo' => $request->input('tipo'),
            'contenido' => $request->input('contenido'),
            'fecha_vencimiento' => $request->input('fecha_vencimiento'),
            'completada' => false
        ]);

        return response()->json([
            'message' => 'Actividad guardada correctamente',
            'activity' => $activity->load('autor')
        ]);
    }

    public function addProduct(Request $request, int $id)
    {
        $request->validate([
            'producto_id' => 'required|exists:producto,id',
            'cantidad' => 'required|integer|min:1',
        ]);

        $deal = CrmDeal::findOrFail($id);
        $producto = \App\Models\Producto::findOrFail($request->input('producto_id'));
        
        $cantidad = $request->input('cantidad');
        $precio = $producto->precio_final ?? 0; // Asumiendo que el producto tiene un accessor precio_final o precio
        if (!$precio && isset($producto->precio)) {
             $precio = $producto->precio; // Ajusta según el esquema de tu producto
        }
        $subtotal = $precio * $cantidad;

        $deal->products()->create([
            'producto_id' => $producto->id,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio,
            'descuento' => 0,
            'subtotal' => $subtotal
        ]);

        $deal->valor = $deal->products()->sum('subtotal');
        $deal->save();

        return response()->json(['message' => 'Producto agregado', 'valor' => $deal->valor]);
    }

    public function removeProduct(int $id, int $productId)
    {
        $deal = CrmDeal::findOrFail($id);
        $deal->products()->where('id', $productId)->delete();
        
        $deal->valor = $deal->products()->sum('subtotal');
        $deal->save();

        return response()->json(['message' => 'Producto eliminado', 'valor' => $deal->valor]);
    }

    public function generateQuote(int $id)
    {
        $deal = CrmDeal::with(['cliente', 'products.producto'])->findOrFail($id);
        
        // Verifica si barryvdh/laravel-dompdf está instalado
        if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            return response()->json(['error' => 'La librería de PDF no está instalada. Ejecuta: composer require barryvdh/laravel-dompdf'], 500);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.crm.quote', compact('deal'));
        
        return $pdf->download('Cotizacion_Deal_'.$deal->id.'.pdf');
    }
}
