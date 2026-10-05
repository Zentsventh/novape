<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $audits = Audit::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15)->through(function ($audit) {
                $sensitive = ['password', 'password_hash', 'remember_token', 'google_id', 'access_token', 'token', 'secret'];
                $audit->old_values = Arr::except($audit->old_values ?? [], $sensitive);
                $audit->new_values = Arr::except($audit->new_values ?? [], $sensitive);

                return $audit;
            });

        return Inertia::render('Admin/AuditLogs/Index', [
            'audits' => $audits,
        ]);
    }
}
