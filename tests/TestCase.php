<?php

namespace Tests;

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Tests use their own database and must remain independent of local maintenance and rate limits.
        $this->withoutMiddleware([
            \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class,
        ]);
    }
}
