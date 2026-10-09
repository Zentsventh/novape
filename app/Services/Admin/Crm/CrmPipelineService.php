<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Models\CrmDeal;
use App\Models\CrmStage;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CrmPipelineService
{
    public function getPipelineData(array $filters = []): array
    {
        $query = CrmDeal::with(['cliente', 'empresa'])->orderByDesc('updated_at')->orderByDesc('id');
        if (! empty($filters['q'])) {
            $term = mb_substr($filters['q'], 0, 100);
            $query->where(fn ($q) => $q->where('titulo', 'like', '%'.$term.'%')
                ->orWhereHas('cliente', fn ($c) => $c->where('nombres', 'like', '%'.$term.'%')->orWhere('apellidos', 'like', '%'.$term.'%'))
                ->orWhereHas('empresa', fn ($c) => $c->where('nombre', 'like', '%'.$term.'%')));
        }
        $page = $query->paginate(60)->withQueryString();
        $stages = CrmStage::withCount('deals')->orderBy('orden')->get();
        foreach ($stages as $stage) {
            $stage->setRelation('deals', $page->getCollection()->where('stage_id', $stage->id)->values());
        }

        return ['stages' => $stages->toArray(), 'pagination' => $page->toArray()];
    }

    public function storeDeal(array $data): CrmDeal
    {
        return DB::transaction(function () use ($data) {
            $data['estado'] = $data['estado'] ?? 'open';
            $data['valor'] = $data['valor'] ?? 0;
            $deal = CrmDeal::create($data);

            TimelineService::log($deal, 'deal_creado', "Oportunidad creada: {$deal->titulo}");
            AutomationEngineService::trigger('deal_created', $deal);

            return $deal;
        });
    }

    public function updateDeal(CrmDeal $deal, array $data): void
    {
        DB::transaction(function () use ($deal, $data) {
            $locked = CrmDeal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            if (array_key_exists('valor', $data)) $data['valor'] ??= 0;
            $before = $locked->only(['titulo', 'valor', 'empresa_id', 'usuario_id', 'fecha_cierre_esperada']);
            $locked->fill(\Illuminate\Support\Arr::except($data, ['stage_id', 'estado']));
            // Quoted line totals remain authoritative when the opportunity has products.
            if ($locked->products()->exists()) $locked->valor = $locked->products()->sum('subtotal');
            $locked->save();
            $after = $locked->only(array_keys($before));
            if ($before !== $after) TimelineService::log($locked, 'deal_actualizado', 'Oportunidad actualizada', ['before' => $before, 'after' => $after]);
            $this->updateDealStage($locked, ['stage_id' => $data['stage_id'], 'estado' => $data['estado'] ?? $locked->estado]);
        });
    }

    public function archiveDeal(CrmDeal $deal): void
    {
        DB::transaction(function () use ($deal) {
            $locked = CrmDeal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            TimelineService::log($locked, 'deal_archivado', 'Oportunidad archivada');
            $locked->delete();
        });
    }

    /**
     * Move a deal to a new stage and potentially a new status.
     */
    public function updateDealStage(CrmDeal $deal, array $data): void
    {
        DB::transaction(function () use ($deal, $data) {
            // Lock the deal to prevent race conditions when updating stage/status
            $lockedDeal = CrmDeal::where('id', $deal->id)->lockForUpdate()->firstOrFail();

            $oldStageId = $lockedDeal->stage_id;
            $oldEstado = $lockedDeal->estado;

            $newStageId = (int) $data['stage_id'];
            $lockedDeal->stage_id = $newStageId;

            if (isset($data['estado'])) {
                $lockedDeal->estado = $data['estado'];
            }

            if ($lockedDeal->estado === 'won' || $lockedDeal->estado === 'lost') {
                $lockedDeal->fecha_cierre_real ??= now();
            }

            if ($lockedDeal->estado === 'open') {
                $lockedDeal->fecha_cierre_real = null;
            }
            $lockedDeal->save();

            if ($oldStageId !== $newStageId) {
                $stage = CrmStage::find($newStageId);
                TimelineService::log($lockedDeal, 'deal_movido', 'Movido a la etapa '.($stage ? $stage->nombre : ''), [
                    'from_stage_id' => $oldStageId,
                    'to_stage_id' => $newStageId,
                ]);

                AutomationEngineService::trigger('deal_moved', $lockedDeal, [
                    'from_stage_id' => $oldStageId,
                    'to_stage_id' => $newStageId,
                ]);
            }

            if ($oldEstado !== $lockedDeal->estado) {
                if (in_array($lockedDeal->estado, ['won', 'lost'], true)) {
                    AutomationEngineService::trigger('deal_'.$lockedDeal->estado, $lockedDeal);
                }
                TimelineService::log($lockedDeal, 'estado_cambiado', "Estado cambiado a {$lockedDeal->estado}", [
                    'from_estado' => $oldEstado,
                    'to_estado' => $lockedDeal->estado,
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
                'completada' => false,
            ]);

            TimelineService::log($deal, 'actividad_creada', "Se creó una actividad ({$data['tipo']})", [
                'activity_id' => $activity->id,
                'tipo' => $data['tipo'],
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
            $deal = CrmDeal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            $producto = Producto::findOrFail($data['producto_id']);
            $cantidad = (int) $data['cantidad'];
            if ($cantidad < 1) {
                throw ValidationException::withMessages(['cantidad' => 'La cantidad debe ser mayor a cero.']);
            }

            $variant = $producto->variantes()->where('activo', true)->whereKey($data['variante_id'] ?? 0)->first();
            $precio = $variant?->precio;
            if ($precio === null || ! $producto->activo) {
                throw ValidationException::withMessages(['producto_id' => 'El producto no tiene una variante activa con precio.']);
            }
            $subtotal = $precio * $cantidad;

            $deal->products()->create([
                'producto_id' => $producto->id,
                'variante_id' => $variant->id,
                'sku' => $variant->sku,
                'producto_nombre' => $producto->nombre,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio,
                'descuento' => 0,
                'subtotal' => $subtotal,
            ]);

            $this->recalculateDealValue($deal);

            TimelineService::log($deal, 'producto_agregado', "Se agregó el producto {$producto->nombre}", [
                'producto_id' => $producto->id,
                'cantidad' => $cantidad,
                'subtotal' => $subtotal,
            ]);
        });
    }

    /**
     * Remove a product from a deal.
     */
    public function removeProduct(CrmDeal $deal, int $productId): void
    {
        DB::transaction(function () use ($deal, $productId) {
            $deal = CrmDeal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            $dealProduct = $deal->products()->where('id', $productId)->with('producto')->first();
            $productName = $dealProduct && $dealProduct->producto ? $dealProduct->producto->nombre : 'producto';

            $deal->products()->where('id', $productId)->delete();
            $this->recalculateDealValue($deal);

            TimelineService::log($deal, 'producto_eliminado', "Se eliminó el producto {$productName}", [
                'product_id' => $productId,
            ]);
        });
    }

    private function recalculateDealValue(CrmDeal $deal): void
    {
        $deal->valor = $deal->products()->sum('subtotal');
        $deal->save();
    }

    /**
     * Actualiza los campos personalizados de forma segura y transaccional.
     */
    public function updateCustomFields(CrmDeal $deal, array $fields): void
    {
        DB::transaction(function () use ($deal, $fields) {
            $deal = CrmDeal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            $deal->setAttribute('custom_fields', array_merge($deal->custom_fields?->toArray() ?? [], $fields));
            $deal->save();

            TimelineService::log($deal, 'campos_actualizados', 'Campos personalizados actualizados');
        });
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
                'completada' => false,
            ]);
        }

        if ($oldEstado !== 'lost' && $newEstado === 'lost') {
            $deal->activities()->create([
                'usuario_id' => $authorId,
                'tipo' => 'tarea',
                'contenido' => '🤖 Automatización: Enviar encuesta de salida para entender los motivos de pérdida.',
                'fecha_vencimiento' => now()->addDays(2),
                'completada' => false,
            ]);
        }

        if ($oldStageId !== $newStageId && $newEstado === 'open') {
            $stage = CrmStage::find($newStageId);
            if ($stage && (stripos($stage->nombre, 'contacto') !== false || stripos($stage->nombre, 'reunión') !== false)) {
                $deal->activities()->create([
                    'usuario_id' => $authorId,
                    'tipo' => 'tarea',
                    'contenido' => '🤖 Automatización: Llamar al cliente para agendar/preparar demostración.',
                    'fecha_vencimiento' => now()->addDay(),
                    'completada' => false,
                ]);
            }
        }
    }
}
