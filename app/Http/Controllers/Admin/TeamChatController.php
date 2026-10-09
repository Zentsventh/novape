<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Team\TeamAccess;
use Inertia\Inertia;

class TeamChatController extends Controller
{
    public function index()
    {
        TeamAccess::user();
        return Inertia::render('Admin/Team/Index');
    }
}
