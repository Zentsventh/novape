<?php

declare(strict_types=1);

namespace App\Services\User;

use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Mail\VerificarCelularMail;

class UserProfileService
{
    public function updateProfile(Usuario $usuario, array $data): void
    {
        $updateData = [
            'nombres' => $data['nombres'],
            'apellidos' => $data['apellidos'],
        ];

        if (array_key_exists('tipo_documento', $data)) {
            $updateData['tipo_documento'] = $data['tipo_documento'];
        }

        if (array_key_exists('dni', $data)) {
            $updateData['dni'] = $data['dni'];
        }
        if (array_key_exists('fecha_nacimiento', $data)) $updateData['fecha_nacimiento'] = $data['fecha_nacimiento'];

        $usuario->update($updateData);
    }

    public function requestPhoneOtp(Usuario $usuario, string $telefono): void
    {
        $codigo = (string) random_int(100000, 999999);
        
        Session::put('phone_update_otp', $codigo);
        Session::put('phone_update_new_number', $telefono);
        Session::put('phone_update_expires_at', now()->addMinutes(10));

        Mail::to($usuario->email)->send(new VerificarCelularMail($usuario, $codigo));
    }

    public function verifyPhoneOtp(Usuario $usuario, string $codigo): void
    {
        $codigoGuardado = Session::get('phone_update_otp');
        $expiraEn = Session::get('phone_update_expires_at');
        $nuevoCelular = Session::get('phone_update_new_number');

        if (!$codigoGuardado || !$expiraEn || now()->greaterThan($expiraEn)) {
            throw new \Exception('El código ha expirado o no es válido. Solicita uno nuevo.');
        }

        if ($codigo !== $codigoGuardado) {
            throw new \Exception('El código ingresado es incorrecto.');
        }

        $usuario->update(['telefono' => $nuevoCelular]);

        Session::forget(['phone_update_otp', 'phone_update_new_number', 'phone_update_expires_at']);
    }

    public function updatePassword(Usuario $usuario, string $newPassword, ?string $currentPassword = null): void
    {
        if ($usuario->has_set_password && !Hash::check($currentPassword, $usuario->password_hash)) {
            throw new \Exception('La contraseña actual no es correcta.');
        }

        $usuario->update([
            'password_hash' => bcrypt($newPassword),
            'has_set_password' => true,
        ]);
    }

    public function addAddress(Usuario $usuario, array $data, bool $isPrincipal): void
    {
        $data = array_map(fn ($value) => is_string($value) ? trim($value) : $value, $data);
        if (empty($data['direccion'])) throw \Illuminate\Validation\ValidationException::withMessages(['direccion' => 'Ingresa la dirección de entrega.']);
        \App\Services\Shipping\LimaCoverage::validate($data);
        DB::transaction(function () use ($usuario, $data, $isPrincipal) {
            Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            $existing = $usuario->direcciones()->where('direccion', trim($data['direccion']))->where('distrito', $data['distrito'])->first();
            $isPrincipal = $isPrincipal || ! $usuario->direcciones()->exists() || (bool) $existing?->principal;
            if ($isPrincipal) $usuario->direcciones()->update(['principal' => false]);
            $values = \Illuminate\Support\Arr::only($data, ['direccion', 'referencia', 'departamento', 'provincia', 'distrito', 'codigo_postal']);
            $values['principal'] = $isPrincipal;
            $usuario->direcciones()->updateOrCreate(['direccion' => trim($data['direccion']), 'distrito' => $data['distrito']], $values);
        });
    }

    public function setPrincipalAddress(Usuario $usuario, int $addressId): void
    {
        DB::transaction(function () use ($usuario, $addressId) {
            Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            $direccion = $usuario->direcciones()->lockForUpdate()->findOrFail($addressId);
            $usuario->direcciones()->update(['principal' => false]);
            $direccion->update(['principal' => true]);
        });
    }

    public function deleteAddress(Usuario $usuario, int $addressId): void
    {
        DB::transaction(function () use ($usuario, $addressId) {
            Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            $address = $usuario->direcciones()->findOrFail($addressId);
            $principal = $address->principal;
            $address->delete();
            if ($principal && ($next = $usuario->direcciones()->orderBy('id')->first())) $next->update(['principal' => true]);
        });
    }

    public function addCard(Usuario $usuario, array $data): void
    {
        throw \Illuminate\Validation\ValidationException::withMessages(['tarjeta' => 'El guardado de tarjetas requiere tokenización habilitada por Niubiz.']);
    }

    public function deleteCard(Usuario $usuario, int $cardId): void
    {
        $usuario->tarjetas()->findOrFail($cardId)->delete();
    }

    public function updateRefundData(Usuario $usuario, array $data): void
    {
        $datos = $usuario->datosReembolso()->first();
        if ($datos) {
            $datos->update($data);
        } else {
            $usuario->datosReembolso()->create($data);
        }
    }

    public function deleteSession(Usuario $usuario, string $sessionId): void
    {
        DB::table('sessions')->where('id', $sessionId)->where('user_id', $usuario->id)->delete();
    }

    public function deleteAccount(Usuario $usuario, string $password): void
    {
        if (!Hash::check($password, $usuario->password_hash)) {
            throw new \Exception('La contraseña no es correcta.');
        }

        $usuario->delete();
    }
}
