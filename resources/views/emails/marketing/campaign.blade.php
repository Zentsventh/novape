<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Novape</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Novape - Electrodomésticos</h2>
    </div>

    <div class="content">
        {{ $contentHtml }}
    </div>

    <div class="footer">
        <p>Has recibido este correo porque eres un cliente registrado en Novape.</p>
        <p>&copy; {{ date('Y') }} Novape. Todos los derechos reservados.</p>
    </div>
</body>
</html>
