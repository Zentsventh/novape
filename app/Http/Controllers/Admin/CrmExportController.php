<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\Usuario;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CrmExportController extends Controller
{
    public function export(Request $request): StreamedResponse
    {
        $type = $request->input('type'); // 'companies', 'deals', 'personas'
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="export_' . $type . '_' . date('Y-m-d_His') . '.csv"',
        ];

        return response()->stream(function () use ($type) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for Excel UTF-8 compatibility
            fputs($file, "\xEF\xBB\xBF");

            if ($type === 'companies') {
                fputcsv($file, ['ID', 'Nombre', 'Dominio', 'Industria', 'Tamaño', 'Teléfono', 'Email', 'Responsable ID', 'Creado']);
                
                CrmCompany::chunk(100, function ($companies) use ($file) {
                    foreach ($companies as $c) {
                        fputcsv($file, [
                            $c->id, $c->nombre, $c->dominio, $c->industria, $c->tamaño, 
                            $c->telefono, $c->email, $c->usuario_responsable_id, $c->created_at
                        ]);
                    }
                });
            } elseif ($type === 'deals') {
                fputcsv($file, ['ID', 'Título', 'Valor', 'Estado', 'Etapa ID', 'Empresa ID', 'Persona ID', 'Creado']);
                
                CrmDeal::chunk(100, function ($deals) use ($file) {
                    foreach ($deals as $d) {
                        fputcsv($file, [
                            $d->id, $d->titulo, $d->valor, $d->estado, $d->stage_id, 
                            $d->empresa_id, $d->usuario_id, $d->created_at
                        ]);
                    }
                });
            } elseif ($type === 'personas') {
                fputcsv($file, ['ID', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'Empresa ID', 'Creado']);
                
                Usuario::where('estado', 'activo')->chunk(100, function ($personas) use ($file) {
                    foreach ($personas as $p) {
                        fputcsv($file, [
                            $p->id, $p->nombres, $p->apellidos, $p->email, $p->telefono, 
                            $p->empresa_id, $p->created_at
                        ]);
                    }
                });
            }

            fclose($file);
        }, 200, $headers);
    }
}
