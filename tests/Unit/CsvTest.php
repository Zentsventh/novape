<?php

namespace Tests\Unit;

use App\Support\Csv;
use PHPUnit\Framework\TestCase;

class CsvTest extends TestCase
{
    public function test_streaming_export_does_not_consume_rows_until_download_starts(): void
    {
        $consumed = 0;
        $rows = (function () use (&$consumed) {
            for ($i = 1; $i <= 1000; $i++) {
                $consumed++;
                yield [$i, 'Cliente, "prueba"'];
            }
        })();
        $response = Csv::download(['ID', 'Nombre'], $rows, 'clientes.csv');
        $this->assertSame(0, $consumed);
        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $this->assertSame(1000, $consumed);
        $this->assertStringStartsWith("\xEF\xBB\xBFID,Nombre\n", $content);
        $this->assertStringContainsString('1000,"Cliente, ""prueba"""', $content);
    }

    public function test_csv_preserves_quotes_commas_line_breaks_and_unicode(): void
    {
        $fields = ['José, "cliente"', "Primera línea\nSegunda línea", 'SKU\\123', ''];
        $this->assertSame($fields, str_getcsv(Csv::row($fields), ',', '"', ''));
    }

    public function test_untrusted_text_cannot_execute_spreadsheet_formulas(): void
    {
        $result = str_getcsv(Csv::row(['=SUM(1,2)', ' @SUM(1)', '+51123456789', '-CMD', 25]), ',', '"', '');
        $this->assertSame(["'=SUM(1,2)", "' @SUM(1)", "'+51123456789", "'-CMD", '25'], $result);
    }
}
