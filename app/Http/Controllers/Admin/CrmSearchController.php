<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\Usuario;
use App\Models\CrmActivity;
use Illuminate\Http\JsonResponse;

class CrmSearchController extends Controller
{
    /**
     * Endpoint for global search (Cmd+K palette)
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');
        
        if (!$query || strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // 1. Search Deals
        $deals = CrmDeal::where('titulo', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'titulo', 'valor', 'estado']);
            
        foreach ($deals as $deal) {
            $results[] = [
                'id' => 'deal_' . $deal->id,
                'type' => 'Oportunidad',
                'title' => $deal->titulo,
                'subtitle' => 'S/ ' . number_format((float)$deal->valor, 2),
                'url' => route('admin.crm.deals.show', $deal->id),
                'icon' => 'target'
            ];
        }

        // 2. Search Companies
        $companies = CrmCompany::where('nombre', 'like', "%{$query}%")
            ->orWhere('dominio', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'nombre', 'industria']);

        foreach ($companies as $company) {
            $results[] = [
                'id' => 'company_' . $company->id,
                'type' => 'Empresa',
                'title' => $company->nombre,
                'subtitle' => $company->industria ?? 'Sin industria',
                'url' => route('admin.crm.companies.show', $company->id),
                'icon' => 'building'
            ];
        }

        // 3. Search Contacts (Usuarios)
        $contacts = Usuario::where('nombres', 'like', "%{$query}%")
            ->orWhere('apellidos', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'nombres', 'apellidos', 'email']);

        foreach ($contacts as $contact) {
            $results[] = [
                'id' => 'contact_' . $contact->id,
                'type' => 'Persona',
                'title' => $contact->nombres . ' ' . $contact->apellidos,
                'subtitle' => $contact->email,
                'url' => url('/admin/clientes/' . $contact->id), // Adjust route if needed
                'icon' => 'user'
            ];
        }
        // 4. Search Activities (Tasks/Calls)
        $activities = CrmActivity::where('titulo', 'like', "%{$query}%")
            ->orWhere('tipo', 'like', "%{$query}%")
            ->limit(3)
            ->get(['id', 'titulo', 'tipo', 'deal_id']);

        foreach ($activities as $activity) {
            $results[] = [
                'id' => 'activity_' . $activity->id,
                'type' => 'Actividad',
                'title' => $activity->titulo,
                'subtitle' => ucfirst($activity->tipo),
                'url' => $activity->deal_id ? route('admin.crm.deals.show', $activity->deal_id) : '#',
                'icon' => 'check-square'
            ];
        }

        return response()->json($results);
    }
}
