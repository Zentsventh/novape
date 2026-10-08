<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Services\Marketing\MarketingConsent;
use Illuminate\Http\Request;

class MarketingPreferenceController extends Controller
{
    public function show(Request $request)
    {
        return inertia('Auth/MarketingPreferences', ['enabled' => MarketingConsent::allows($request->user()), 'unsubscribe' => false]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['promotions' => 'required|boolean']);
        MarketingConsent::update($request->user(), (bool) $data['promotions']);
        return back()->with('success', 'Preferencias de comunicaciones actualizadas.');
    }

    private function recipient(Request $request): Usuario
    {
        $user = Usuario::findOrFail($request->query('user'));
        abort_unless(hash_equals(hash('sha256', mb_strtolower($user->email)), (string) $request->query('recipient')), 403);
        return $user;
    }

    public function unsubscribePage(Request $request)
    {
        $this->recipient($request);
        return inertia('Auth/MarketingPreferences', ['enabled' => true, 'unsubscribe' => true, 'action' => $request->fullUrl()]);
    }

    public function unsubscribe(Request $request)
    {
        MarketingConsent::update($this->recipient($request), false);
        return inertia('Auth/MarketingPreferences', ['enabled' => false, 'unsubscribe' => true, 'completed' => true]);
    }
}
