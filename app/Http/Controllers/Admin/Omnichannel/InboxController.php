<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin\Omnichannel;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class InboxController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Inbox/Index');
    }
}
