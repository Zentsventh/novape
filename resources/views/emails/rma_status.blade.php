<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Actualización de Garantía/Devolución</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: #3b82f6; color: white; padding: 30px 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px; }
        .status-box { padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; background: #eff6ff; }
        .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
        .value { font-size: 16px; font-weight: 600; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Actualización de tu Solicitud</h1>
        </div>
        
        <div class="content">
            <p>Hola <strong>{{ $rma->usuario->nombres }}</strong>,</p>
            <p>Te escribimos para informarte que el estado de tu solicitud de <strong>{{ $rma->type === 'return' ? 'Devolución' : ($rma->type === 'exchange' ? 'Cambio' : 'Garantía') }}</strong> ha sido actualizado.</p>
            
            <div class="status-box">
                <div class="label">Nuevo Estado</div>
                <div class="value" style="color: #3b82f6; font-size: 20px;">
                    @if($rma->status === 'approved')
                        Aprobado (Esperando Envío)
                    @elseif($rma->status === 'received')
                        Recibido - En Revisión Técnica
                    @elseif($rma->status === 'processed')
                        Completado / Procesado
                    @elseif($rma->status === 'rejected')
                        Rechazado
                    @else
                        {{ ucfirst($rma->status) }}
                    @endif
                </div>
                
                <div class="label">N° de Solicitud (RMA)</div>
                <div class="value">#{{ str_pad($rma->id, 6, '0', STR_PAD_LEFT) }}</div>
                
                <div class="label">Pedido Relacionado</div>
                <div class="value">#{{ $rma->pedido_id }}</div>
            </div>

            @if($rma->admin_notes)
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fde68a; margin: 20px 0;">
                <div class="label" style="color: #d97706;">Mensaje de nuestro equipo:</div>
                <p style="margin: 10px 0 0 0; color: #92400e;">{{ $rma->admin_notes }}</p>
            </div>
            @endif

            <p>Puedes ver todos los detalles de tu caso iniciando sesión en tu perfil de nuestra tienda.</p>
            
            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/perfil/devoluciones/{{ $rma->id }}" class="btn">Ver Detalles del Caso</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a esta dirección.<br>
            Si tienes dudas, contáctanos a soporte@novape.com</p>
        </div>
    </div>
</body>
</html>
