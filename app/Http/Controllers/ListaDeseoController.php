<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Profile\StoreWishlistRequest;
use App\Http\Requests\Profile\SyncWishlistsRequest;
use App\Http\Requests\Profile\ToggleWishlistRequest;
use App\Models\Usuario;
use App\Services\Profile\WishlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class ListaDeseoController extends Controller
{
    public function __construct(
        private readonly WishlistService $wishlistService
    ) {}

    public function storeLista(StoreWishlistRequest $request): RedirectResponse
    {

        $this->wishlistService->createList(
            $this->currentUser(),
            $request->input('nombre'),
            (bool) $request->input('es_publica', false)
        );

        return back()->with('success', 'Lista creada exitosamente.');
    }

    public function destroyLista(int $id): RedirectResponse
    {
        $this->wishlistService->deleteList($this->currentUser(), $id);

        return back()->with('success', 'Lista eliminada.');
    }

    public function getLists(): JsonResponse
    {
        $usuario = $this->currentUser();

        $listas = $this->wishlistService->getLists($usuario);

        return response()->json($listas);
    }

    public function syncWishlists(SyncWishlistsRequest $request): RedirectResponse
    {
        $this->wishlistService->syncWishlists(
            $this->currentUser(),
            (int) $request->input('producto_id'),
            $request->input('lista_ids', [])
        );

        return back()->with('success', 'Listas guardadas exitosamente.');
    }

    public function toggleWishlist(ToggleWishlistRequest $request): RedirectResponse
    {
        $message = $this->wishlistService->toggleWishlist(
            $this->currentUser(),
            (int) $request->input('producto_id'),
            $request->input('lista_id') ? (int) $request->input('lista_id') : null
        );

        return back()->with('success', $message);
    }

    public function destroyListaItem(int $id): RedirectResponse
    {
        $item = \App\Models\UsuarioListaItem::findOrFail($id);
        
        if ($item->lista->usuario_id !== $this->currentUser()->id) {
            abort(403);
        }

        $item->delete();

        return back()->with('success', 'Producto removido de la lista.');
    }

    public function destroyListItem(int $id): RedirectResponse
    {
        return $this->destroyListaItem($id);
    }

    private function currentUser(): Usuario
    {
        $user = auth('web')->user();
        abort_unless($user instanceof Usuario, 401);

        return $user;
    }
}
