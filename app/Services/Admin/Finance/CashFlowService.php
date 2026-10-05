<?php

declare(strict_types=1);

namespace App\Services\Admin\Finance;

use Illuminate\Support\Facades\DB;

class CashFlowService
{
    public function openRegister(array $data, int $userId): void
    {
        DB::transaction(function () use ($data, $userId) {
            DB::table('usuario')->where('id', $userId)->lockForUpdate()->first();
            $abierta = DB::table('cajas_sesiones')
                ->where('cajero_id', $userId)
                ->where('estado', 'abierta')
                ->exists();

            if ($abierta) {
                throw new \Exception('Ya tienes una caja abierta.');
            }

            DB::table('cajas_sesiones')->insert([
                'cajero_id' => $userId,
                'monto_inicial' => $data['monto_inicial'],
                'fecha_apertura' => now(),
                'estado' => 'abierta',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function closeRegister(array $data, int $userId): string
    {
        return DB::transaction(function () use ($data, $userId) {
            $caja = DB::table('cajas_sesiones')
                ->where('cajero_id', $userId)
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                throw new \Exception('No tienes una caja abierta para cerrar.');
            }

            $ventasEfectivo = DB::table('venta_pos_pagos')
                ->join('ventas_pos', 'venta_pos_pagos.venta_pos_id', '=', 'ventas_pos.id')
                ->join('metodos_pago', 'venta_pos_pagos.metodo_pago_id', '=', 'metodos_pago.id')
                ->where('ventas_pos.caja_sesion_id', $caja->id)
                ->where('metodos_pago.nombre', 'LIKE', '%Efectivo%')
                ->sum('venta_pos_pagos.monto');

            $ingresos = DB::table('caja_movimientos')
                ->where('caja_sesion_id', $caja->id)
                ->where('tipo', 'ingreso')
                ->sum('monto');

            $egresos = DB::table('caja_movimientos')
                ->where('caja_sesion_id', $caja->id)
                ->where('tipo', 'egreso')
                ->sum('monto');

            $ventasTotal = DB::table('ventas_pos')
                ->where('caja_sesion_id', $caja->id)
                ->sum('total');

            $monto_final_esperado = $caja->monto_inicial + $ventasEfectivo + $ingresos - $egresos;
            $descuadre = $data['monto_final_declarado'] - $monto_final_esperado;

            DB::table('cajas_sesiones')->where('id', $caja->id)->update([
                'fecha_cierre' => now(),
                'monto_final_esperado' => $monto_final_esperado,
                'monto_final_declarado' => $data['monto_final_declarado'],
                'descuadre' => $descuadre,
                'estado' => 'cerrada',
                'updated_at' => now(),
            ]);

            return "Caja cerrada. Ventas totales: S/ {$ventasTotal}. Ingresos Extras: S/ {$ingresos}. Egresos: S/ {$egresos}. Descuadre Efectivo: S/ {$descuadre}";
        });
    }

    public function recordMovement(array $data, int $userId): void
    {
        DB::transaction(function () use ($data, $userId) {
            $caja = DB::table('cajas_sesiones')
                ->where('cajero_id', $userId)
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                throw new \Exception('Debes abrir caja antes de registrar movimientos.');
            }

            DB::table('caja_movimientos')->insert([
                'caja_sesion_id' => $caja->id,
                'usuario_id' => $userId,
                'tipo' => $data['tipo'],
                'monto' => $data['monto'],
                'concepto' => $data['concepto'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }
}
