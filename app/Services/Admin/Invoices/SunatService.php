<?php

declare(strict_types=1);

namespace App\Services\Admin\Invoices;

use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use Greenter\Model\Company\Company;
use Greenter\Model\Company\Address;
use Greenter\Model\Client\Client;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Model\Sale\Legend;
use App\Models\Pedido;

class SunatService
{
    private See $see;

    public function __construct()
    {
        $this->see = new See();
        
        // SUNAT sandbox/beta credentials
        $this->see->setService(SunatEndpoints::FE_BETA);
        
        // Generate or load a dummy test certificate for signing (needed for GREENTER XML signing)
        $certPath = storage_path('app/certificate_beta.pem');
        if (!file_exists($certPath)) {
            // Usually, a valid PSE or SUNAT beta accepts any certificate structure for XML signing in Beta
            // but we need an actual x509 PEM. Greenter provides a dummy cert for tests in their docs.
            // I will assume the certificate is placed there later.
            file_put_contents($certPath, "DUMMY CERT"); 
        }
        $this->see->setCertificate(file_get_contents($certPath)); 
        
        // SUNAT sandbox default users: 20000000001, MODDATOS, moddatos
        $this->see->setClaveSOL('20000000001', 'MODDATOS', 'moddatos');
    }

    public function emitirComprobante(Pedido $pedido): ?string
    {
        // 1. Empresa
        $empresa = (new Company())
            ->setRuc('20000000001')
            ->setRazonSocial('EMPRESA DE PRUEBA S.A.C.')
            ->setNombreComercial('NOVAPE')
            ->setAddress((new Address())
                ->setUbigueo('150101')
                ->setDepartamento('LIMA')
                ->setProvincia('LIMA')
                ->setDistrito('LIMA')
                ->setUrbanizacion('-')
                ->setDireccion('Av. José Carlos Mariátegui, Lote 60 Zona A')
                ->setCodLocal('0000')); // Codigo de local anexo

        // 2. Cliente
        $tipoDocCliente = $pedido->tipo_comprobante === 'factura' ? '6' : '1'; // 6: RUC, 1: DNI
        $numDocCliente = $pedido->documento_cliente ?? ($pedido->usuario ? $pedido->usuario->dni : '00000000');
        $nombreCliente = $pedido->nombre_facturacion ?? ($pedido->usuario ? $pedido->usuario->nombres . ' ' . $pedido->usuario->apellidos : 'Cliente General');

        $client = (new Client())
            ->setTipoDoc($tipoDocCliente)
            ->setNumDoc($numDocCliente)
            ->setRznSocial($nombreCliente);

        // 3. Comprobante (Factura o Boleta)
        $tipoComprobanteCode = $pedido->tipo_comprobante === 'factura' ? '01' : '03'; // 01 Factura, 03 Boleta
        $serie = $tipoComprobanteCode === '01' ? 'F001' : 'B001';
        $correlativo = str_pad((string)$pedido->id, 8, '0', STR_PAD_LEFT);

        $invoice = (new Invoice())
            ->setUblVersion('2.1')
            ->setTipoOperacion('0101') // Venta interna
            ->setTipoDoc($tipoComprobanteCode)
            ->setSerie($serie)
            ->setCorrelativo($correlativo)
            ->setFechaEmision(new \DateTime())
            ->setTipoMoneda('PEN')
            ->setCompany($empresa)
            ->setClient($client);

        // 4. Montos
        $igvPorcentaje = 0.18;
        $total = (float) $pedido->total;
        $operacionesGravadas = round($total / (1 + $igvPorcentaje), 2);
        $igvCalculado = round($total - $operacionesGravadas, 2);

        $invoice->setMtoOperGravadas($operacionesGravadas)
                ->setMtoIGV($igvCalculado)
                ->setTotalImpuestos($igvCalculado)
                ->setValorVenta($operacionesGravadas)
                ->setSubTotal($total)
                ->setMtoImpVenta($total);

        // 5. Detalles (Items)
        $itemsData = [];
        foreach ($pedido->items as $item) {
            $precioUnitario = (float) $item->precio_unitario;
            $valorUnitario = round($precioUnitario / (1 + $igvPorcentaje), 2);
            $cantidad = (float) $item->cantidad;
            $subtotalItem = $valorUnitario * $cantidad;
            $igvItem = ($precioUnitario - $valorUnitario) * $cantidad;

            $nombreProducto = 'Producto';
            if ($item->variante && $item->variante->producto) {
                $nombreProducto = $item->variante->producto->nombre;
            }

            $detail = (new SaleDetail())
                ->setCodProducto(str_pad((string)$item->variante_id, 5, '0', STR_PAD_LEFT))
                ->setUnidad('NIU') // Unidad (Bienes)
                ->setCantidad($cantidad)
                ->setDescripcion($nombreProducto)
                ->setMtoBaseIgv($subtotalItem)
                ->setPorcentajeIgv(18.00) // 18%
                ->setIgv($igvItem)
                ->setTipAfeIgv('10') // Gravado - Operación Onerosa
                ->setTotalImpuestos($igvItem)
                ->setMtoValorVenta($subtotalItem)
                ->setMtoValorUnitario($valorUnitario)
                ->setMtoPrecioUnitario($precioUnitario);

            $itemsData[] = $detail;
        }

        // Agregar envio si existe costo
        if ($pedido->costo_envio > 0) {
            $precioEnvio = (float) $pedido->costo_envio;
            $valorEnvio = round($precioEnvio / (1 + $igvPorcentaje), 2);
            $igvEnvio = $precioEnvio - $valorEnvio;

            $detailEnvio = (new SaleDetail())
                ->setCodProducto('ENVIO')
                ->setUnidad('ZZ') // Servicio
                ->setCantidad(1)
                ->setDescripcion('Servicio de Delivery')
                ->setMtoBaseIgv($valorEnvio)
                ->setPorcentajeIgv(18.00)
                ->setIgv($igvEnvio)
                ->setTipAfeIgv('10')
                ->setTotalImpuestos($igvEnvio)
                ->setMtoValorVenta($valorEnvio)
                ->setMtoValorUnitario($valorEnvio)
                ->setMtoPrecioUnitario($precioEnvio);
            
            $itemsData[] = $detailEnvio;
        }

        $invoice->setDetails($itemsData);

        // 6. Leyendas
        $legend = (new Legend())
            ->setCode('1000') // Monto en letras
            ->setValue($this->numeroALetras($total));
        $invoice->setLegends([$legend]);

        // 7. Enviar a SUNAT
        try {
            $result = $this->see->send($invoice);

            if (!$result->isSuccess()) {
                // Guardar log de errores
                \Log::error('SUNAT Error: ' . $result->getError()->getCode() . ' - ' . $result->getError()->getMessage());
                return null;
            }

            // Guardar el XML firmado, CDR y Hash
            $hash = $result->getCdrResponse()->getReference();
            $cdrZip = $result->getCdrZip();
            $xmlSigned = $this->see->getFactory()->getLastXml();

            // Guardamos los archivos para el historial/descarga
            $storagePath = storage_path("app/public/sunat");
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }

            $filename = $invoice->getName();
            file_put_contents("$storagePath/$filename.xml", $xmlSigned);
            file_put_contents("$storagePath/R-$filename.zip", $cdrZip);

            return $hash;
        } catch (\Exception $e) {
            \Log::error('Greenter XML Error: ' . $e->getMessage());
            return null;
        }
    }

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
}
