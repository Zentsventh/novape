<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\Usuario;
use App\Support\Csv;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CrmExportController extends Controller
{
    public function export(Request $request): StreamedResponse
    {
        $request->validate(['type' => 'required|in:companies,deals,personas']);
        $type = $request->input('type'); // 'companies', 'deals', 'personas'

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="export_'.$type.'_'.date('Y-m-d_His').'.csv"',
        ];

        return response()->stream(function () use ($type) {
            $file = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fwrite($file, "\xEF\xBB\xBF");

            if ($type === 'companies') {
                fwrite($file, Csv::row(['ID', 'Nombre', 'Dominio', 'Industria', 'Tamaño', 'Teléfono', 'Email', 'Responsable ID', 'Creado']));

                CrmCompany::chunk(100, function ($companies) use ($file) {
                    foreach ($companies as $c) {
                        fwrite($file, Csv::row([
                            $c->id, $c->nombre, $c->dominio, $c->industria, $c->tamaño,
                            $c->telefono, $c->email, $c->usuario_responsable_id, $c->created_at,
                        ]));
                    }
                });
            } elseif ($type === 'deals') {
                fwrite($file, Csv::row(['ID', 'Título', 'Valor', 'Estado', 'Etapa ID', 'Empresa ID', 'Persona ID', 'Creado']));

                CrmDeal::chunk(100, function ($deals) use ($file) {
                    foreach ($deals as $d) {
                        fwrite($file, Csv::row([
                            $d->id, $d->titulo, $d->valor, $d->estado, $d->stage_id,
                            $d->empresa_id, $d->usuario_id, $d->created_at,
                        ]));
                    }
                });
            } elseif ($type === 'personas') {
                fwrite($file, Csv::row(['ID', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'Empresa ID', 'Creado']));

                Usuario::where('estado', 'activo')
                    ->whereDoesntHave('roles', fn ($roles) => $roles->where('nombre', '!=', 'cliente'))
                    ->chunk(100, function ($personas) use ($file) {
                    foreach ($personas as $p) {
                        fwrite($file, Csv::row([
                            $p->id, $p->nombres, $p->apellidos, $p->email, $p->telefono,
                            $p->empresa_id, $p->created_at,
                        ]));
                    }
                });
            }

            fclose($file);
        }, 200, $headers);
    }
}
