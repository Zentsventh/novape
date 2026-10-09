<?php

namespace App\Services\Chatbot;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Smalot\PdfParser\Parser;
use ZipArchive;

class KnowledgeDocumentReader
{
    public function read(UploadedFile $file): string
    {
        $type = strtolower($file->getClientOriginalExtension());
        try {
            $text = match ($type) {
                'pdf' => (new Parser)->parseFile($file->getPathname())->getText(),
                'docx' => $this->word($file->getPathname()),
                'txt', 'md' => (string) file_get_contents($file->getPathname()),
                default => throw new \RuntimeException('Formato no permitido.'),
            };
        } catch (\Throwable $e) {
            throw ValidationException::withMessages(['file' => 'No se pudo leer el documento. Usa PDF con texto, DOCX, TXT o MD sin contraseña.']);
        }
        if (! mb_check_encoding($text, 'UTF-8') || str_contains($text, "\0") || mb_strlen(trim($text)) < 20 || mb_strlen($text) > 200000) {
            throw ValidationException::withMessages(['file' => 'El documento debe contener entre 20 y 200.000 caracteres legibles en UTF-8. Los PDF escaneados necesitan convertirse a texto (OCR).']);
        }
        return $text;
    }

    private function word(string $path): string
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) throw new \RuntimeException('DOCX inválido.');
        try {
            $stat = $zip->statName('word/document.xml');
            if (! $stat || $stat['size'] > 4000000) throw new \RuntimeException('Documento demasiado grande.');
            $xml = $zip->getFromName('word/document.xml');
            if (! $xml || stripos($xml, '<!DOCTYPE') !== false || stripos($xml, '<!ENTITY') !== false) throw new \RuntimeException('XML inválido.');
            $previous = libxml_use_internal_errors(true);
            try {
                $document = simplexml_load_string($xml, \SimpleXMLElement::class, LIBXML_NONET);
                if ($document === false) throw new \RuntimeException('XML inválido.');
                $document->registerXPathNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
                $paragraphs = [];
                foreach ($document->xpath('//w:p') ?: [] as $paragraph) {
                    $paragraph->registerXPathNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
                    $paragraphs[] = implode('', array_map(fn ($node) => (string) $node, $paragraph->xpath('.//w:t') ?: []));
                }
                return implode("\n", $paragraphs);
            } finally {
                libxml_clear_errors();
                libxml_use_internal_errors($previous);
            }
        } finally {
            $zip->close();
        }
    }
}
