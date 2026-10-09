<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificación - Novape</title>
</head>
<body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <tr>
            <td style="background-color: #004797; text-align: center; padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">NOVAPE</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #333333; margin-top: 0; font-size: 22px; font-weight: 600;">Verificación de Cambio de Celular</h2>
                <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Hola {{ $user->nombres }}, <br><br>
                    Hemos recibido una solicitud para actualizar tu número de celular asociado a tu cuenta de Novape. Para continuar con este proceso y por medidas de seguridad, por favor ingresa el siguiente código de verificación:
                </p>
                <div style="text-align: center; margin: 35px 0;">
                    <span style="display: inline-block; background-color: #f1f8ff; color: #004797; font-size: 36px; font-weight: bold; padding: 15px 40px; border-radius: 8px; letter-spacing: 5px; border: 2px dashed #004797;">
                        {{ $codigo }}
                    </span>
                </div>
                <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                    Este código expirará en 10 minutos.
                </p>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0;">
                    Si no solicitaste este cambio, por favor ignora este correo o contáctanos de inmediato a atencionalcliente@novape.me.
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f9f9f9; text-align: center; padding: 20px;">
                <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                    © {{ date('Y') }} Novape. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
