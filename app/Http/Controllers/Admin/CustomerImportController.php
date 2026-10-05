<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CustomerImportController extends Controller
{
    /**
     * Muestra la página de importación CSV.
     */
    public function index()
    {
        return Inertia::render('Admin/Clientes/Import');
    }

    /**
     * Preview: parsea el CSV y devuelve las primeras filas para previsualización.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120', // Max 5MB
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if (! $handle) {
            return response()->json(['error' => 'No se pudo leer el archivo'], 422);
        }

        // Leer headers
        $headers = fgetcsv($handle, 0, ',');
        if (! $headers) {
            fclose($handle);

            return response()->json(['error' => 'El archivo CSV está vacío'], 422);
        }

        // Limpiar BOM si existe
        $headers[0] = preg_replace('/^\x{FEFF}/u', '', $headers[0]);
        $headers = array_map('trim', $headers);

        // Leer primeras 10 filas para preview
        $rows = [];
        $totalRows = 0;
        while (($data = fgetcsv($handle, 0, ',')) !== false) {
            $totalRows++;
            if ($totalRows <= 10) {
                $row = [];
                foreach ($headers as $i => $header) {
                    $row[$header] = $data[$i] ?? '';
                }
                $rows[] = $row;
            }
        }
        fclose($handle);

        // Mapeo automático sugerido
        $fieldMap = $this->suggestFieldMapping($headers);

        return response()->json([
            'headers' => $headers,
            'preview' => $rows,
            'totalRows' => $totalRows,
            'suggestedMapping' => $fieldMap,
        ]);
    }

    /**
     * Procesa la importación completa del CSV.
     */
    public function process(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'mapping' => 'required|array',
            'mapping.nombres' => 'required|string',
            'mapping.*' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $mapping = $request->input('mapping');
        $handle = fopen($file->getRealPath(), 'r');

        if (! $handle) {
            return response()->json(['error' => 'No se pudo leer el archivo'], 422);
        }
        // Skip header
        $headers = fgetcsv($handle, 0, ',');
        if (! $headers || $headers === [null]) {
            fclose($handle);

            return response()->json(['error' => 'El archivo CSV está vacío'], 422);
        }
        $headers[0] = preg_replace('/^\x{FEFF}/u', '', $headers[0]);
        $headers = array_map('trim', $headers);
        foreach ($mapping as $column) {
            if ($column && ! in_array($column, $headers, true)) {
                fclose($handle);

                return response()->json(['error' => 'El mapeo contiene una columna que no existe en el archivo'], 422);
            }
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $clienteRol = Rol::where('nombre', 'cliente')->first();

        DB::beginTransaction();
        try {
            $rowNum = 1;
            while (($data = fgetcsv($handle, 0, ',')) !== false) {
                $rowNum++;
                $row = [];
                foreach ($headers as $i => $header) {
                    $row[$header] = trim($data[$i] ?? '');
                }

                // Extraer campos según mapping
                $nombres = $row[$mapping['nombres']] ?? '';
                $apellidos = $row[$mapping['apellidos'] ?? ''] ?? '';
                $email = $row[$mapping['email'] ?? ''] ?? null;
                $telefono = $row[$mapping['telefono'] ?? ''] ?? null;
                $dni = $row[$mapping['dni'] ?? ''] ?? null;

                $validation = Validator::make([
                    'nombres' => $nombres, 'apellidos' => $apellidos, 'email' => $email ?: null,
                    'telefono' => $telefono ?: null, 'dni' => $dni ?: null,
                ], [
                    'nombres' => 'required|string|max:255', 'apellidos' => 'nullable|string|max:255',
                    'email' => 'nullable|email|max:255', 'telefono' => 'nullable|string|max:20',
                    'dni' => 'nullable|digits:8',
                ]);
                if ($validation->fails()) {
                    $errors[] = "Fila {$rowNum}: ".$validation->errors()->first();
                    $skipped++;

                    continue;
                }

                // Validación básica
                if (empty($nombres)) {
                    $errors[] = "Fila {$rowNum}: Nombre vacío, omitida.";
                    $skipped++;

                    continue;
                }

                // Verificar duplicado por email o DNI
                if ($email && Usuario::where('email', $email)->exists()) {
                    $errors[] = "Fila {$rowNum}: Email '{$email}' ya existe, omitida.";
                    $skipped++;

                    continue;
                }

                if ($dni && Usuario::where('dni', $dni)->exists()) {
                    $errors[] = "Fila {$rowNum}: DNI '{$dni}' ya existe, omitida.";
                    $skipped++;

                    continue;
                }

                $usuario = Usuario::create([
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'email' => $email ?: null,
                    'telefono' => $telefono ?: null,
                    'dni' => $dni ?: null,
                    'estado' => 'activo',
                    'password_hash' => Hash::make(Str::random(32)),
                ]);

                if ($clienteRol) {
                    $usuario->roles()->attach($clienteRol->id);
                }

                $imported++;
            }

            DB::commit();
            fclose($handle);

            // Notificación al admin
            AdminNotification::send('import_csv', 'Importación CSV completada', "{$imported} clientes importados, {$skipped} omitidos.", [
                'icon' => 'upload',
                'color' => 'green',
                'link' => '/admin/clientes',
            ]);

            return response()->json([
                'success' => true,
                'imported' => $imported,
                'skipped' => $skipped,
                'errors' => array_slice($errors, 0, 20), // Limitar a 20 errores
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            fclose($handle);

            return response()->json(['error' => 'Error al procesar: '.$e->getMessage()], 500);
        }
    }

    /**
     * Sugerir mapeo automático de columnas.
     */
    private function suggestFieldMapping(array $headers): array
    {
        $map = [];
        $normalize = fn ($s) => mb_strtolower(trim(str_replace(['_', '-', ' '], '', $s)));

        $patterns = [
            'nombres' => ['nombres', 'nombre', 'name', 'firstname', 'primernombre'],
            'apellidos' => ['apellidos', 'apellido', 'lastname', 'surname'],
            'email' => ['email', 'correo', 'correoelectronico', 'mail'],
            'telefono' => ['telefono', 'celular', 'phone', 'mobile', 'tel'],
            'dni' => ['dni', 'documento', 'ruc', 'nrodocumento', 'cedula', 'identificacion'],
        ];

        foreach ($patterns as $field => $keywords) {
            foreach ($headers as $header) {
                if (in_array($normalize($header), $keywords)) {
                    $map[$field] = $header;
                    break;
                }
            }
        }

        return $map;
    }
}
