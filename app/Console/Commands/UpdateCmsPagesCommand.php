<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\ConfiguracionSitio;
use App\Models\Page;

class UpdateCmsPagesCommand extends Command
{
    protected $signature = 'cms:populate';
    protected $description = 'Populates CMS pages with realistic data.';

    public function handle()
    {
        $this->info('Populating CMS pages with realistic data...');

        $pages = [
            'nosotros' => [
                ['heading' => 'Nuestra Historia', 'body' => '<p>Desde nuestros inicios, en <strong>Novape Electrodomésticos</strong> nos hemos propuesto llevar la mejor tecnología para el hogar a las familias peruanas. Comenzamos como una pequeña tienda de exhibición y hoy en día contamos con un sólido centro de distribución y canales de atención digital. Nuestra misión es facilitar el acceso a electrodomésticos de última generación con garantía certificada y un soporte técnico en el que puedes confiar.</p>'],
                ['heading' => 'Misión y Visión', 'body' => '<p><strong>Nuestra Misión:</strong> Mejorar la calidad de vida de nuestros clientes ofreciendo electrodomésticos eficientes, innovadores y accesibles, con un servicio al cliente excepcional.</p><p><strong>Nuestra Visión:</strong> Consolidarnos como el retail especializado líder en electrohogar y tecnología a nivel nacional, reconocidos por nuestra integridad, innovación y excelencia operativa.</p>']
            ],
            'trabaja-con-nosotros' => [
                ['heading' => 'Únete a nuestro equipo', 'body' => '<p>En Novape creemos que nuestro talento humano es la pieza fundamental de nuestro éxito. Buscamos personas apasionadas, proactivas y comprometidas con el servicio al cliente. Si te apasiona la tecnología, el comercio electrónico y quieres desarrollarte en un ambiente de innovación constante, ¡queremos conocerte!</p>'],
                ['heading' => 'Oportunidades actuales', 'body' => '<p>Envía tu CV actualizado indicando el área de tu interés a nuestro correo oficial de Recursos Humanos: <strong>rrhh@novape.pe</strong>. Constantemente estamos en la búsqueda de talento para áreas como Ventas Digitales, Atención al Cliente, Logística y Almacén.</p>']
            ],
            'terminos' => [
                ['heading' => 'Términos y Condiciones Generales', 'body' => '<p>El acceso y uso de este sitio web están sujetos a los siguientes términos y condiciones y a la legislación peruana aplicable. Al utilizar nuestro sitio, usted acepta estos términos en su totalidad.</p>'],
                ['heading' => 'Disponibilidad y Precios', 'body' => '<p>Los precios y promociones mostrados en nuestra tienda en línea son exclusivos para compras web y pueden variar respecto a nuestra tienda física. El stock de los productos está sujeto a disponibilidad. En caso de no contar con el producto luego de realizada la compra, nos pondremos en contacto para ofrecer un cambio o el reembolso íntegro.</p>']
            ],
            'privacidad' => [
                ['heading' => 'Políticas de Privacidad', 'body' => '<p>En Novape Electrodomésticos S.A.C. estamos comprometidos con la protección de tus datos personales, cumpliendo rigurosamente con la Ley N° 29733, Ley de Protección de Datos Personales del Perú. La información que recopilamos (nombres, DNI, dirección, teléfono) es utilizada exclusivamente para procesar tus compras, emitir comprobantes de pago y coordinar el despacho a domicilio.</p>'],
                ['heading' => 'Uso de Cookies', 'body' => '<p>Utilizamos cookies esenciales para el funcionamiento de nuestro carrito de compras y para analizar de forma anónima el tráfico de nuestro sitio, permitiéndonos mejorar continuamente tu experiencia de usuario.</p>']
            ],
            'ayuda' => [
                ['heading' => 'Centro de Atención', 'body' => '<p>Si tienes inconvenientes con tu pedido o necesitas asesoría comercial, nuestro equipo está listo para ayudarte. Puedes comunicarte a nuestra central telefónica <strong>(01) 555-0123</strong> o escribirnos a nuestro WhatsApp oficial <strong>+51 987654321</strong> en nuestros horarios de atención.</p>'],
                ['heading' => 'Garantía Técnica', 'body' => '<p>Todos nuestros electrodomésticos cuentan con la garantía oficial de la marca fabricante. Para reportar un incidente dentro del periodo de garantía, te sugerimos contactar directamente a los centros de servicio autorizados (CAS) detallados en el manual de tu producto, llevando siempre tu boleta o factura de compra.</p>']
            ],
            'devoluciones' => [
                ['heading' => 'Políticas de Cambio y Devolución', 'body' => '<p>Conforme a las leyes de protección al consumidor, aceptamos devoluciones o cambios dentro de los primeros <strong>7 días calendario</strong> posteriores a la entrega, única y exclusivamente por <strong>fallas de fábrica</strong> debidamente certificadas por el servicio técnico oficial de la marca.</p>'],
                ['heading' => 'Requisitos para devoluciones', 'body' => '<ul><li>Presentar comprobante de pago original (Boleta o Factura).</li><li>El producto debe ser entregado con todos sus empaques originales completos, manuales, etiquetas y accesorios sin signos de deterioro.</li><li>El producto no debe presentar daños físicos, golpes, quiñes, rayaduras ni signos de mala manipulación o instalación incorrecta.</li></ul>']
            ],
            'faq' => [
                ['heading' => '¿Hacen envíos a provincia?', 'body' => '<p>Sí, realizamos despachos a nivel nacional a través de agencias de carga certificadas y couriers asociados. El costo de envío varía según la provincia de destino y el volumen (peso volumétrico) del electrodoméstico. Podrás ver el cálculo exacto durante el proceso de pago.</p>'],
                ['heading' => '¿Qué métodos de pago aceptan?', 'body' => '<p>Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express, Diners Club) a través de nuestra pasarela de pagos 100% segura. También aceptamos pagos mediante transferencias bancarias directas, Yape y Plin.</p>'],
                ['heading' => '¿Puedo comprar en la web y retirar en tienda?', 'body' => '<p>¡Claro que sí! Puedes seleccionar la opción de "Retiro en Tienda" al momento de finalizar tu compra. Te enviaremos un correo de confirmación en cuanto tu pedido esté listo para ser recogido en nuestro Almacén Central en Ate.</p>']
            ]
        ];

        DB::transaction(function () use ($pages) {
            foreach ($pages as $slug => $sections) {
                // Update Settings
                ConfiguracionSitio::establecer('page_'.$slug, json_encode($sections, JSON_UNESCAPED_UNICODE));
                
                // Update Page model if exists
                $page = Page::where('slug', $slug)->first();
                if ($page) {
                    $page->sections = $sections;
                    $page->save();
                } else {
                    Page::create([
                        'slug' => $slug,
                        'title' => ucfirst(str_replace('-', ' ', $slug)),
                        'is_active' => true,
                        'sections' => $sections
                    ]);
                }
            }
        });

        $this->info('CMS pages populated successfully.');
    }
}
