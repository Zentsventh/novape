<?php

declare(strict_types=1);

namespace App\Support;

use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class Csv
{
    public static function download(array $headers, iterable $rows, string $filename): StreamedResponse
    {
        return new StreamedResponse(function () use ($headers, $rows): void {
            echo "\xEF\xBB\xBF";
            echo self::row($headers);
            foreach ($rows as $row) {
                echo self::row($row);
            }
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => HeaderUtils::makeDisposition('attachment', $filename),
        ]);
    }

    public static function row(array $values): string
    {
        $stream = fopen('php://temp', 'w+');
        $values = array_map(function ($value): string {
            $text = (string) ($value ?? '');
            // Keep imported text from executing formulas when opened in a spreadsheet.
            if (is_string($value) && preg_match('/^[\s]*[=+\-@]/u', $text)) {
                $text = "'".$text;
            }

            return $text;
        }, $values);
        fputcsv($stream, $values, ',', '"', '');
        rewind($stream);
        $result = stream_get_contents($stream);
        fclose($stream);

        return $result;
    }
}
