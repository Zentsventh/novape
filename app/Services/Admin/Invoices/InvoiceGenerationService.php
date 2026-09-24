<?php

declare(strict_types=1);

namespace App\Services\Admin\Invoices;

use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class InvoiceGenerationService
{
    private function numeroALetras(float $number): string
    {
        $centenas = ['', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '];
        $decenas = ['', 'DIEZ ', 'VEINTE ', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA '];
        $unidades = ['', 'UNO ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE ', 'DIEZ ', 'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISEIS ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE ', 'VEINTE ', 'VEINTIUNO ', 'VEINTIDOS ', 'VEINTITRES ', 'VEINTICUATRO ', 'VEINTICINCO ', 'VEINTISEIS ', 'VEINTISIETE ', 'VEINTIOCHO ', 'VEINTINUEVE '];

        $convertGroup = function($n) use ($centenas, $decenas, $unidades) {
            $output = '';
            if ($n == 100) return 'CIEN ';
            if ($n >= 100) {
                $output .= $centenas[floor($n / 100)];
                $n = $n % 100;
            }
            if ($n < 30 && $n > 0) {
                $output .= $unidades[$n];
            } elseif ($n >= 30) {
                $output .= $decenas[floor($n / 10)];
                if ($n % 10 > 0) {
                    $output .= 'Y ' . $unidades[$n % 10];
                }
            }
            return $output;
        };

        $intPart = (int) floor($number);
        $decimalPart = round(($number - $intPart) * 100);
        $decimalStr = str_pad((string)$decimalPart, 2, '0', STR_PAD_LEFT);

        if ($intPart == 0) {
            $letras = 'CERO ';
        } else {
            $letras = '';
            if ($intPart >= 1000000) {
                $millones = floor($intPart / 1000000);
                $letras .= $millones == 1 ? 'UN MILLON ' : $convertGroup($millones) . 'MILLONES ';
                $intPart = $intPart % 1000000;
            }
            if ($intPart >= 1000) {
                $miles = floor($intPart / 1000);
                $letras .= $miles == 1 ? 'MIL ' : $convertGroup($miles) . 'MIL ';
                $intPart = $intPart % 1000;
            }
            if ($intPart > 0) {
                $letras .= $convertGroup($intPart);
            }
        }

        return "SON: " . trim($letras) . " CON {$decimalStr}/100 SOLES";
    }

    public function generatePosInvoice(int $id): string
    {
        $venta = DB::table('ventas_pos')
            ->leftJoin('clientes', 'ventas_pos.cliente_id', '=', 'clientes.id')
            ->leftJoin('usuario', 'ventas_pos.cajero_id', '=', 'usuario.id')
            ->select('ventas_pos.*', 
                     'clientes.nombre_razon_social as cliente_nombre', 
                     'clientes.numero_documento as cliente_doc',
                     'clientes.tipo_documento as cliente_tipo_doc', 
                     'clientes.direccion as cliente_direccion', 
                     'usuario.nombres as cajero_nombre')
            ->where('ventas_pos.id', $id)
            ->first();

        if (!$venta) {
            throw new \Exception('Venta no encontrada');
        }

        $items = DB::table('venta_pos_items')->where('venta_pos_id', $id)->get();

        $igvPorcentaje = 0.18;
        $total = (float) $venta->total;
        $operacionesGravadas = round($total / (1 + $igvPorcentaje), 2);
        $igvCalculado = round($total - $operacionesGravadas, 2);

        $nombreCliente = $venta->cliente_nombre;
        $docCliente = $venta->cliente_doc;
        $tipoDocCliente = $venta->cliente_tipo_doc === 'RUC' ? '6' : '1';

        if ($venta->tipo_comprobante === 'factura') {
            if (empty($docCliente) || $tipoDocCliente !== '6') {
                $nombreCliente = "FACTURA REQUIERE RUC VÁLIDO";
            }
        } else if ($venta->tipo_comprobante === 'boleta') {
            if ($total >= 700 && empty($docCliente)) {
                $nombreCliente = "REQUIERE DNI (MONTO >= S/700)";
            } else if (empty($docCliente)) {
                $nombreCliente = "CLIENTES VARIOS";
                $docCliente = "00000000";
            }
        } else {
            if (empty($nombreCliente)) {
                $nombreCliente = "Público General";
                $docCliente = "---";
            }
        }

        $importeEnLetras = $this->numeroALetras($total);
        $qrUrl = url("/comprobante/{$venta->codigo_ticket}");
        
        $qrCodeSvg = QrCode::size(120)->generate($qrUrl);
        $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode((string)$qrCodeSvg);

        $qrStoragePath = storage_path("app/public/qrs");
        if (!file_exists($qrStoragePath)) {
            mkdir($qrStoragePath, 0755, true);
        }
        file_put_contents("{$qrStoragePath}/qr_{$venta->codigo_ticket}.svg", $qrCodeSvg);

        $logoPath = public_path('images/logofactura.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $data = [
            'venta' => $venta,
            'items' => $items,
            'operacionesGravadas' => $operacionesGravadas,
            'igvCalculado' => $igvCalculado,
            'total' => $total,
            'importeEnLetras' => $importeEnLetras,
            'nombreCliente' => $nombreCliente,
            'docCliente' => $docCliente,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'empresa' => [
                'razon_social' => 'NOVAPE S.A.C.',
                'ruc' => '20123456789',
                'direccion' => 'Av. José Carlos Mariátegui, Lote 60 Zona A',
                'telefono' => '+51 986 784 384',
                'email' => 'atencionalcliente@novape.me',
                'horario' => 'Lunes a Viernes de 9 am a 6 pm'
            ]
        ];

        $pdfName = "{$venta->codigo_ticket}.pdf";
        $storagePath = storage_path("app/public/facturas");
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0755, true);
        }
        $fullPath = "{$storagePath}/{$pdfName}";

        Pdf::loadView('pdf.ticket_pos', $data)
            ->setPaper(array(0, 0, 226.77, 841.89), 'portrait')
            ->save($fullPath);

        return $fullPath;
    }

    public function getPublicInvoicePath(string $codigo_ticket): string
    {
        $venta = DB::table('ventas_pos')->where('codigo_ticket', $codigo_ticket)->first();
        if (!$venta) {
            throw new \Exception('Comprobante no encontrado');
        }

        $pdfPath = storage_path("app/public/facturas/{$venta->codigo_ticket}.pdf");
        if (!file_exists($pdfPath)) {
            return $this->generatePosInvoice((int)$venta->id);
        }
        
        return $pdfPath;
    }

    public function downloadInvoicePdf(\App\Models\Pedido $pedido)
    {
        $igvPorcentaje = 0.18;
        $total = (float) $pedido->total;
        $operacionesGravadas = round($total / (1 + $igvPorcentaje), 2);
        $igvCalculado = round($total - $operacionesGravadas, 2);

        $nombreCliente = $pedido->nombre_facturacion ?? ($pedido->usuario ? $pedido->usuario->nombres . ' ' . $pedido->usuario->apellidos : 'Cliente General');
        $docCliente = $pedido->documento_cliente ?? ($pedido->usuario ? $pedido->usuario->dni : '00000000');
        $tipoDocCliente = $pedido->tipo_comprobante === 'factura' ? 'RUC' : 'DNI';

        $importeEnLetras = $this->numeroALetras($total);
        $qrUrl = url("/seguimiento?codigo={$pedido->codigo}");
        
        $qrCodeSvg = QrCode::size(120)->generate($qrUrl);
        $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode((string)$qrCodeSvg);

        $logoPath = public_path('images/logofactura.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $items = $pedido->items;

        $data = [
            'pedido' => $pedido,
            'items' => $items,
            'operacionesGravadas' => $operacionesGravadas,
            'igvCalculado' => $igvCalculado,
            'total' => $total,
            'importeEnLetras' => $importeEnLetras,
            'nombreCliente' => $nombreCliente,
            'docCliente' => $docCliente,
            'tipo_comprobante' => strtoupper($pedido->tipo_comprobante ?? 'BOLETA'),
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'empresa' => [
                'razon_social' => 'NOVAPE S.A.C.',
                'ruc' => '20123456789',
                'direccion' => 'Av. José Carlos Mariátegui, Lote 60 Zona A',
                'telefono' => '+51 986 784 384',
                'email' => 'atencionalcliente@novape.me',
                'horario' => 'Lunes a Viernes de 9 am a 6 pm'
            ]
        ];

        $html = view('pdf.comprobante_ecommerce', $data)->render();

        $pdfContent = \Spatie\Browsershot\Browsershot::html($html)
            ->format('A4')
            ->showBackground()
            ->margins(0, 0, 0, 0)
            ->pdf();

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="comprobante_' . $pedido->codigo . '.pdf"',
        ]);
    }
}
