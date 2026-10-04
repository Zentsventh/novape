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
        $usuario->update([
            'nombres' => $data['nombres'],
            'apellidos' => $data['apellidos'],
            'dni' => $data['dni'],
        ]);
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
        if ($isPrincipal) {
            $usuario->direcciones()->update(['principal' => false]);
        }
        $usuario->direcciones()->create($data);
    }

    public function setPrincipalAddress(Usuario $usuario, int $addressId): void
    {
        $usuario->direcciones()->update(['principal' => false]);
        $direccion = $usuario->direcciones()->findOrFail($addressId);
        $direccion->principal = true;
        $direccion->save();
    }

    public function deleteAddress(Usuario $usuario, int $addressId): void
    {
        $usuario->direcciones()->findOrFail($addressId)->delete();
    }

    public function addCard(Usuario $usuario, array $data): void
    {
        $ultimos = substr($data['numero_tarjeta'], -4);
        $marca = str_starts_with($data['numero_tarjeta'], '4') ? 'Visa' : (str_starts_with($data['numero_tarjeta'], '5') ? 'Mastercard' : 'Amex');
        
        $usuario->tarjetas()->create([
            'ultimos_digitos' => $ultimos,
            'marca' => $marca,
            'principal' => $usuario->tarjetas()->count() === 0,
            'token_simulado' => 'tok_' . uniqid(),
        ]);
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
