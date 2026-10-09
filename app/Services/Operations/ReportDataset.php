<?php
namespace App\Services\Operations;

use Illuminate\Support\Facades\Schema;

final class ReportDataset
{
    public static function apply($query, string $table, ?string $alias = null)
    {
        if (!config('reporting.include_demo') && Schema::hasColumn($table, 'seed_batch')) {
            $query->whereNull(($alias ?: $table).'.seed_batch');
        }
        return $query;
    }
}
