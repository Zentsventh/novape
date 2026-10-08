<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class PageController extends Controller
{
    private function getLogo()
    {
        return ConfiguracionSitio::obtener('logo_url');
    }

    private function renderPagina($slug, $defaultTitle, $defaultSections)
    {
        $page = \App\Models\Page::where('slug', $slug)->where('is_active', true)->first();
        
        $title = $page ? $page->title : $defaultTitle;
        $sections = $page && $page->sections ? $page->sections : $defaultSections;
        
        // Mantener también las configuraciones "legacy" si existen y no hay página en BD
        if (!$page && $legacySections = json_decode(ConfiguracionSitio::obtener('page_'.$slug, '[]'), true)) {
            $sections = $legacySections;
        }

        $contact = trim(ConfiguracionSitio::obtener('telefono_contacto', '').' · '.ConfiguracionSitio::obtener('email_contacto', ''), ' ·');
        $rules = \App\Services\Storefront\CommercePolicy::summary();
        if (in_array($slug,['devoluciones','terminos','faq'],true)) {
            $sections[] = ['heading'=>'Devoluciones y cambios','body'=>'Puedes solicitar una devolución comercial durante '.$rules['return_window_days'].' días calendario desde la entrega o retiro mediante el enlace privado de tu compra o tu cuenta. Revisamos los artículos recibidos y su condición antes de confirmar la solución. Los cambios se tramitan como devolución y una nueva compra; no reservan automáticamente un reemplazo. Las garantías se revisan según la documentación real del producto y proveedor.'];
            $sections[] = ['heading'=>'Reembolsos','body'=>'El panel registra importes y evidencia de devoluciones confirmadas por el proveedor de pago. Solicitar un reembolso no confirma su ejecución. El envío no se devuelve automáticamente en una devolución parcial. Una cancelación después del despacho no devuelve unidades al inventario hasta su recepción e inspección.'];
        }
        if (in_array($slug,['ayuda','terminos','faq'],true)) {
            $sections[] = ['heading'=>'Condiciones de compra','body'=>'El precio y la disponibilidad se verifican al preparar el pago. El carrito no reserva unidades. La sesión de pago tiene una vigencia limitada; si el resultado queda en verificación, contacta a soporte con el código de compra antes de intentar otro cobro. El importe final mínimo es S/ '.number_format($rules['minimum_payment'],2).'.'];
            $sections[] = ['heading'=>'Estimación de entrega','body'=>'La estimación operativa es de '.$rules['delivery_min_business_days'].' a '.$rules['delivery_max_business_days'].' días hábiles desde la confirmación del pago, sujeta a coordinación y cobertura. El costo final se muestra antes de pagar.'];
            if ($rules['free_shipping_enabled']) $sections[] = ['heading'=>'Envío gratis','body'=>'Disponible con subtotal de productos desde S/ '.number_format($rules['free_shipping_threshold'],2).' antes de cupón y puntos, según la modalidad confirmada al pagar.'];
        }
        if ($contact && in_array($slug, ['ayuda', 'devoluciones', 'trabaja-con-nosotros'], true)) $sections[] = ['heading' => 'Contacto', 'body' => $contact];
        if ($slug === 'devoluciones' && ($policy = ConfiguracionSitio::obtener('return_policy', ''))) $sections[] = ['heading' => 'Condiciones comerciales', 'body' => $policy];
        if (in_array($slug, ['ayuda', 'faq', 'terminos'], true)) {
            $sections[] = ['heading' => 'Cobertura de entrega', 'body' => 'Realizamos entregas en Lima Metropolitana. El costo y la modalidad disponibles se confirman antes de pagar.'];
            if ($eta = ConfiguracionSitio::obtener('delivery_eta', '')) $sections[] = ['heading' => 'Plazos de entrega', 'body' => $eta];
        }
        if (in_array($slug, ['nosotros', 'terminos', 'privacidad'], true) && ($identity = ConfiguracionSitio::obtener('business_identity', ''))) $sections[] = ['heading' => 'Identificación del negocio', 'body' => $identity];

        return Inertia::render('InfoPage', [
            'title' => $title,
            'sections' => app(\App\Services\Storefront\PageContent::class)->sanitizeSections($sections),
            'logoUrl' => $this->getLogo(),
        ]);
    }

    public function nosotros()
    {
        return $this->renderPagina('nosotros', 'Quienes somos', [
            ['heading' => 'Nuestra historia', 'body' => 'Somos una tienda de tecnología y electrohogar con entrega en Lima Metropolitana.'],
            ['heading' => 'Compromiso', 'body' => 'Trabajamos con marcas confiables, garantia real y atencion personalizada.']
        ]);
    }

    public function trabajaConNosotros()
    {
        return $this->renderPagina('trabaja-con-nosotros', 'Trabaja con nosotros', [
            ['heading' => 'Oportunidades', 'body' => 'Publicamos vacantes para ventas, logistica, tecnologia y atencion al cliente.'],
            ['heading' => 'Postulacion', 'body' => 'Envianos tu CV y cuentanos en que area quieres aportar.']
        ]);
    }

    public function terminos()
    {
        return $this->renderPagina('terminos', 'Términos y condiciones', [
            ['heading' => 'Uso del sitio', 'body' => 'El uso de este sitio implica la aceptacion de nuestras condiciones comerciales.'],
            ['heading' => 'Pagos y envios', 'body' => 'Los plazos pueden variar segun disponibilidad y zona de reparto.']
        ]);
    }

    public function privacidad()
    {
        return $this->renderPagina('privacidad', 'Políticas de privacidad', [
            ['heading' => 'Datos personales', 'body' => 'Protegemos tu informacion y solo la usamos para procesar tus pedidos.'],
            ['heading' => 'Comunicaciones', 'body' => 'Solo enviamos mensajes relacionados con tu compra o promociones si autorizas.']
        ]);
    }

    public function ayuda()
    {
        return $this->renderPagina('ayuda', 'Centro de ayuda', [
            ['heading' => 'Contactanos', 'body' => 'Nuestro equipo puede ayudarte por correo o telefono en horario laboral.'],
            ['heading' => 'Pedidos', 'body' => 'Consulta el estado de tu pedido con tu codigo de compra.']
        ]);
    }

    public function devoluciones()
    {
        return $this->renderPagina('devoluciones', 'Devoluciones', [
            ['heading' => 'Politica', 'body' => 'Aceptamos devoluciones dentro de los plazos legales y con el producto en buen estado.'],
            ['heading' => 'Proceso', 'body' => 'Comunicate con soporte y comparte tu codigo de pedido.']
        ]);
    }

    public function faq()
    {
        return $this->renderPagina('faq', 'Preguntas frecuentes', [
            ['heading' => 'Envios', 'body' => 'Los tiempos de entrega dependen de la zona y disponibilidad.'],
            ['heading' => 'Pagos', 'body' => 'Paga mediante la pasarela Niubiz. Las opciones disponibles se muestran al momento de pagar.']
        ]);
    }
}
