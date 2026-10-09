<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (app()->environment(['local', 'testing']) && filter_var(env('APP_REAL_DEMO_SEED', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->call(RealStoreMonthSeeder::class);
            return;
        }
        if (app()->environment(['local', 'testing']) && filter_var(env('APP_DEMO_SEED', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->call(MasterSeeder::class);
        }
    }
}
