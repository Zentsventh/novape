<?php
return [
    'include_demo' => (bool) env('REPORT_INCLUDE_DEMO', false),
    'retention_days' => (int) env('OPERATIONAL_LOG_RETENTION_DAYS', 180),
];
