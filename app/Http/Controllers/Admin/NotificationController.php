<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Lista las notificaciones del admin autenticado (últimas 20, priorizando no leídas).
     */
    public function index(): JsonResponse
    {
        $userId = auth('admin')->id();

        $notifications = AdminNotification::forUser($userId)
            ->orderByRaw('read_at IS NOT NULL')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'body' => $n->body,
                'icon' => $n->icon,
                'color' => $n->color,
                'link' => $n->link,
                'read' => $n->read_at !== null,
                'time' => $n->created_at->diffForHumans(),
            ]);

        return response()->json($notifications);
    }

    /**
     * Marcar una notificación como leída.
     */
    public function markAsRead(int $id): JsonResponse
    {
        $notification = AdminNotification::findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Marcar todas las notificaciones como leídas.
     */
    public function markAllAsRead(): JsonResponse
    {
        $userId = auth('admin')->id();

        AdminNotification::forUser($userId)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
