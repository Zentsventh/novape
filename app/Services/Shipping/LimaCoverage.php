<?php

declare(strict_types=1);

namespace App\Services\Shipping;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LimaCoverage
{
    public const DISTRICTS = ['Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'];

    public static function validate(array $address): void
    {
        $normalize = fn ($value) => strtoupper(Str::ascii(trim((string) $value)));
        if ($normalize($address['departamento'] ?? '') !== 'LIMA' || $normalize($address['provincia'] ?? '') !== 'LIMA'
            || ! in_array($normalize($address['distrito'] ?? ''), array_map($normalize, self::DISTRICTS), true)) {
            throw ValidationException::withMessages(['address' => 'Por ahora entregamos a domicilio solo en los distritos de Lima Metropolitana.']);
        }
    }
}
