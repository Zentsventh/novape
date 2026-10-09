<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AbandonedCartReminder;
use App\Models\Carrito;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AbandonedCartController extends Controller
{
    public function index()
    {
        $carts = Carrito::with(['usuario:id,nombres,apellidos,email,telefono', 'items.variante.producto:id,nombre'])
            ->whereHas('items')
            ->whereNotNull('usuario_id')
            ->where('updated_at', '<', now()->subHours(2))
            ->orderBy('updated_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Marketing/AbandonedCarts/Index', [
            'carts' => $carts
        ]);
    }

    public function notify(Carrito $cart)
    {
        $user = $cart->usuario;
        if (! $user || ! $user->email || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return redirect()->back()->with('error', 'El cliente no tiene un correo electrónico válido registrado.');
        }

        try {
            Mail::to($user->email)->send(new AbandonedCartReminder($user));
            $cart->update(['notified_at' => now()]);

            return redirect()->back()->with('success', "Recordatorio de carrito enviado correctamente a {$user->email}.");
        } catch (\Throwable $e) {
            report($e);

            return redirect()->back()->with('error', 'No se pudo enviar el correo de recuperación: ' . $e->getMessage());
        }
    }
}
