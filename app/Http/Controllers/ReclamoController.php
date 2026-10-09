<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreReclamoRequest;
use App\Services\RMA\CreateReclamoService;

class ReclamoController extends Controller
{
    public function __construct(
        private readonly CreateReclamoService $createReclamoService
    ) {}

    public function store(StoreReclamoRequest $request)
    {
        $result = $this->createReclamoService->execute($request->validated());

        return back()->with(
            'success', 
            "Su {$result['tipo']} ha sido registrado con éxito. Su código de seguimiento es: {$result['codigo']}. Nos pondremos en contacto pronto."
        );
    }
}
