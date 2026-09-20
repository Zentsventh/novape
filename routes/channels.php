<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Canal privado para la bandeja omnicanal.
 * Solo usuarios autenticados con guard 'admin' pueden escuchar.
 */
Broadcast::channel('novape-inbox', function ($admin) {
    return $admin !== null;
}, ['guards' => ['admin']]);
