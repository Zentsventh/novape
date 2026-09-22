<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use OwenIt\Auditing\Models\Audit;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $audits = Audit::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/AuditLogs/Index', [
            'audits' => $audits
        ]);
    }
}
