<?php

namespace Tests\Feature;

use App\Models\Pago;
use App\Models\Pedido;
use App\Services\Orders\UpdateOrderStatusService;
use Tests\TestCase;

class RefundSafetyTest extends TestCase
{
    public function test_paid_order_cannot_be_cancelled_before_niubiz_refund(): void
    {
        $order = new Pedido(['estado' => 'Pagado']);
        $order->setRelation('pago', new Pago(['estado' => 'completado']));

        $this->expectException(\InvalidArgumentException::class);
        app(UpdateOrderStatusService::class)->execute($order, ['estado' => 'cancelado']);
    }

    public function test_pending_refund_cannot_be_cancelled_directly(): void
    {
        $order = new Pedido(['estado' => 'Pagado']);
        $order->setRelation('pago', new Pago(['estado' => 'reembolso_pendiente']));

        $this->expectException(\InvalidArgumentException::class);
        app(UpdateOrderStatusService::class)->execute($order, ['estado' => 'cancelado']);
    }
}
