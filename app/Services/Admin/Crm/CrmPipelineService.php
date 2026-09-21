<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Models\CrmDeal;
use App\Models\CrmStage;
use App\Models\CrmDealProduct;
use App\Services\Admin\Crm\TimelineService;
use App\Services\Admin\Crm\AutomationEngineService;
use Illuminate\Support\Facades\DB;

class CrmPipelineService
{
    public function getPipelineData(): array
    {
        return CrmStage::with(['deals.cliente', 'deals.empresa'])->orderBy('orden')->get()->toArray();
    }

    public function storeDeal(array $data): CrmDeal
    {
        return DB::transaction(function () use ($data) {
            $data['estado'] = $data['estado'] ?? 'open';
            $deal = CrmDeal::create($data);

            TimelineService::log($deal, 'deal_creado', "Oportunidad creada: {$deal->titulo}");
            AutomationEngineService::trigger('deal_created', $deal);

            return $deal;
        });
    }

    /**
     * Move a deal to a new stage and potentially a new status.
     */
    public function updateDealStage(CrmDeal $deal, array $data): void
    {
        DB::transaction(function () use ($deal, $data) {
            // Lock the deal to prevent race conditions when updating stage/status
            $lockedDeal = CrmDeal::where('id', $deal->id)->lockForUpdate()->first();
            
            $oldStageId = $lockedDeal->stage_id;
            $oldEstado = $lockedDeal->estado;

            $newStageId = (int)$data['stage_id'];
            $lockedDeal->stage_id = $newStageId;
            
            if (isset($data['estado'])) {
                $lockedDeal->estado = $data['estado'];
            }

            if ($lockedDeal->estado === 'won' || $lockedDeal->estado === 'lost') {
                $lockedDeal->fecha_cierre_esperada = now();
            }

            $lockedDeal->save();

            if ($oldStageId !== $newStageId) {
                $stage = CrmStage::find($newStageId);
                TimelineService::log($lockedDeal, 'deal_movido', "Movido a la etapa " . ($stage ? $stage->nombre : ''), [
                    'from_stage_id' => $oldStageId,
                    'to_stage_id' => $newStageId
                ]);
                
                AutomationEngineService::trigger('deal_moved', $lockedDeal, [
                    'from_stage_id' => $oldStageId,
                    'to_stage_id' => $newStageId
                ]);
            }

            if ($oldEstado !== $lockedDeal->estado) {
                TimelineService::log($lockedDeal, 'estado_cambiado', "Estado cambiado a {$lockedDeal->estado}", [
                    'from_estado' => $oldEstado,
                    'to_estado' => $lockedDeal->estado
                ]);
            }

            $this->triggerAutomations($lockedDeal, clone $deal, $oldStageId, $newStageId, $oldEstado, $lockedDeal->estado);
        });
    }

    /**
     * Store an activity for a deal.
     */
    public function storeActivity(CrmDeal $deal, array $data, int $authorId): object
    {
        return DB::transaction(function () use ($deal, $data, $authorId) {
            $activity = $deal->activities()->create([
                'usuario_id' => $authorId,
                'tipo' => $data['tipo'],
                'contenido' => $data['contenido'],
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
                'completada' => false
            ]);

            TimelineService::log($deal, 'actividad_creada', "Se creó una actividad ({$data['tipo']})", [
                'activity_id' => $activity->id,
                'tipo' => $data['tipo']
            ]);

            return $activity;
        });
    }

    /**
     * Add a product to a deal.
     */
    public function addProduct(CrmDeal $deal, array $data): void
    {
        DB::transaction(function () use ($deal, $data) {
            $producto = \App\Models\Producto::findOrFail($data['producto_id']);
            $cantidad = (int)$data['cantidad'];
            
            $precio = $producto->precio_final ?? ($producto->precio ?? 0);
            $subtotal = $precio * $cantidad;

            $deal->products()->create([
                'producto_id' => $producto->id,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio,
                'descuento' => 0,
                'subtotal' => $subtotal
            ]);
            
            $this->recalculateDealValue($deal);

            TimelineService::log($deal, 'producto_agregado', "Se agregó el producto {$producto->nombre}", [
                'producto_id' => $producto->id,
                'cantidad' => $cantidad,
                'subtotal' => $subtotal
            ]);
        });
    }

    /**
     * Remove a product from a deal.
     */
    public function removeProduct(CrmDeal $deal, int $productId): void
    {
        DB::transaction(function () use ($deal, $productId) {
            $dealProduct = $deal->products()->where('id', $productId)->with('producto')->first();
            $productName = $dealProduct && $dealProduct->producto ? $dealProduct->producto->nombre : 'producto';

            $deal->products()->where('id', $productId)->delete();
            $this->recalculateDealValue($deal);

            TimelineService::log($deal, 'producto_eliminado', "Se eliminó el producto {$productName}", [
                'product_id' => $productId
            ]);
        });
    }

    private function recalculateDealValue(CrmDeal $deal): void
    {
        $deal->valor = $deal->products()->sum('subtotal');
        $deal->save();
    }

    private function triggerAutomations(CrmDeal $deal, CrmDeal $oldDeal, int $oldStageId, int $newStageId, string $oldEstado, string $newEstado): void
    {
        $authorId = auth()->id() ?? 1;

        if ($oldEstado !== 'won' && $newEstado === 'won') {
            $deal->activities()->create([
                'usuario_id' => $authorId,
                'tipo' => 'tarea',
                'contenido' => '🤖 Automatización: Generar orden de compra y enviar correo de bienvenida al cliente.',
                'fecha_vencimiento' => now()->addDay(),
                'completada' => false
            ]);
        }

        if ($oldEstado !== 'lost' && $newEstado === 'lost') {
            $deal->activities()->create([
                'usuario_id' => $authorId,
                'tipo' => 'tarea',
                'contenido' => '🤖 Automatización: Enviar encuesta de salida para entender los motivos de pérdida.',
                'fecha_vencimiento' => now()->addDays(2),
                'completada' => false
            ]);
        }

        if ($oldStageId !== $newStageId && $newEstado === 'open') {
            $stage = clone CrmStage::find($newStageId);
            if ($stage && (stripos($stage->nombre, 'contacto') !== false || stripos($stage->nombre, 'reunión') !== false)) {
                $deal->activities()->create([
                    'usuario_id' => $authorId,
                    'tipo' => 'tarea',
                    'contenido' => '🤖 Automatización: Llamar al cliente para agendar/preparar demostración.',
                    'fecha_vencimiento' => now()->addDay(),
                    'completada' => false
                ]);
            }
        }
    }
}
