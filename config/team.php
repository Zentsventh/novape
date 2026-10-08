<?php

return [
    'max_participants' => max(2, min(6, (int) env('TEAM_CALL_MAX_PARTICIPANTS', 6))),
    'ring_seconds' => 90,
    'heartbeat_seconds' => 45,
    'upload_max_kb' => 20480,
    'upload_total_bytes' => 40 * 1024 * 1024,
    'turn_secret' => env('TEAM_TURN_SECRET'),
    'ice_servers' => array_values(array_filter([
        ['urls' => env('TEAM_STUN_URL', 'stun:stun.l.google.com:19302')],
        env('TEAM_TURN_URL') ? ['urls' => array_filter(explode(',', env('TEAM_TURN_URL'))), 'username' => env('TEAM_TURN_USERNAME'), 'credential' => env('TEAM_TURN_PASSWORD')] : null,
    ])),
];
