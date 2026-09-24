<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\Admin\InventarioController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnaliticasController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\ReclamoController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\ShippingController;

use App\Http\Controllers\CompareController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ListaDeseoController;

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AlmacenController;
use App\Http\Controllers\Admin\GastoController;
use App\Http\Controllers\Admin\PosController;
use App\Http\Controllers\Admin\CajaController;
use App\Http\Controllers\Admin\CompraController;
use App\Http\Controllers\Admin\ZonaController;
use App\Http\Controllers\Admin\MetodoPagoController;
use App\Http\Controllers\Admin\ProveedorController;
use App\Http\Controllers\Admin\CuponController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\InvoiceController as AdminInvoiceController;

use App\Models\ConfiguracionSitio;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ==========================================
// RUTAS PÚBLICAS Y DE TIENDA
// ==========================================

Route::controller(HomeController::class)->group(function () {
    Route::get('/', 'index')->name('home');
    Route::get('/catalogo', 'catalogo')->name('catalogo');
    Route::get('/api/search/live', 'liveSearch')->name('api.search.live');
    Route::get('/producto/{slug}', 'producto')->name('producto');
    Route::get('/seguimiento', 'seguimiento')->name('seguimiento');
});

Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::post('/chatbot/message', [ChatbotController::class, 'message'])->name('chatbot.message');
Route::get('/chatbot/poll', [ChatbotController::class, 'pollMessages'])->name('chatbot.poll');
Route::get('/chatbot/history', [ChatbotController::class, 'history'])->name('chatbot.history');
Route::post('/chatbot/close', [ChatbotController::class, 'closeConversation'])->name('chatbot.close');

Route::controller(PageController::class)->group(function () {
    Route::get('/nosotros', 'nosotros')->name('nosotros');
    Route::get('/trabaja-con-nosotros', 'trabajaConNosotros')->name('trabaja');
    Route::get('/terminos', 'terminos')->name('terminos');
    Route::get('/privacidad', 'privacidad')->name('privacidad');
    Route::get('/ayuda', 'ayuda')->name('ayuda');
    Route::get('/devoluciones', 'devoluciones')->name('devoluciones');
    Route::get('/faq', 'faq')->name('faq');
});

Route::get('/libro-de-reclamaciones', fn () => Inertia::render('LibroReclamaciones'))->name('libro-reclamaciones');
Route::post('/libro-de-reclamaciones', [ReclamoController::class, 'store']);

// ==========================================
// AUTENTICACIÓN
// ==========================================

Route::controller(AuthController::class)->group(function () {
    Route::get('/login', 'showLogin')->name('login');
    Route::post('/login', 'login');
    Route::get('/registro', 'showRegister')->name('registro');
    Route::post('/registro', 'register');
    Route::any('/logout', 'logout')->name('logout');
});

Route::controller(GoogleAuthController::class)->prefix('auth/google')->group(function () {
    Route::get('/', 'redirect')->name('google.redirect');
    Route::get('/callback', 'callback')->name('google.callback');
});

// ==========================================
// EXPERIENCIA DE COMPRA (CARRITO Y PAGOS)
// ==========================================

Route::controller(CartController::class)->prefix('cart')->group(function () {
    Route::post('/add', 'add')->name('cart.add');
    Route::post('/update', 'update')->name('cart.update');
    Route::post('/remove', 'remove')->name('cart.remove');
    Route::post('/clear', 'clear')->name('cart.clear');
});

Route::controller(ShippingController::class)->prefix('api/shipping')->group(function () {
    Route::post('/calculate', 'calculate')->name('shipping.calculate');
    Route::post('/validate-address', 'validateAddress')->name('shipping.validate-address');
});

Route::controller(\App\Http\Controllers\CheckoutController::class)->group(function () {
    Route::get('/checkout', 'checkout')->name('checkout');
    Route::post('/api/checkout/apply-coupon', 'applyCoupon');
});

Route::controller(\App\Http\Controllers\NiubizController::class)->group(function () {
    Route::post('/api/checkout/niubiz/session', 'createSession');
    Route::post('/api/checkout/niubiz/authorize', 'authorizeTransaction')->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])->name('checkout.niubiz.authorize');
    Route::get('/checkout/niubiz/success', 'success')->name('checkout.niubiz.success');
});

Route::controller(CompareController::class)->prefix('comparador')->group(function () {
    Route::get('/', 'index')->name('comparador.index');
    Route::post('/add', 'add')->name('comparador.add');
    Route::post('/remove', 'remove')->name('comparador.remove');
    Route::post('/clear', 'clear')->name('comparador.clear');
});

// Comprobantes Públicos
Route::get('/comprobante/{codigo_ticket}', [AdminInvoiceController::class, 'verComprobantePublico'])->name('comprobante.publico');
Route::get('/comprobante/ecommerce/{codigo}', [InvoiceController::class, 'verComprobanteEcommerce'])->name('comprobante.ecommerce.publico');

// ==========================================
// PERFIL DE USUARIO PRIVADO
// ==========================================

Route::middleware('auth')->group(function () {
    Route::controller(ProfileController::class)->prefix('perfil')->group(function () {
        Route::get('/', 'index')->name('perfil');
        Route::get('/compras/{codigo}', 'showOrder')->name('perfil.compras.show');
        Route::post('/update', 'update')->name('perfil.update');
        Route::post('/celular/solicitar-codigo', 'requestPhoneUpdateOtp')->middleware('throttle:3,1')->name('perfil.celular.solicitar');
        Route::post('/celular/verificar-codigo', 'verifyPhoneUpdateOtp')->name('perfil.celular.verificar');
        Route::post('/password', 'updatePassword')->name('perfil.password');
        
        // Direcciones
        Route::post('/direccion', 'storeDireccion')->name('perfil.direccion.store');
        Route::post('/direccion/{id}/principal', 'setPrincipalDireccion')->name('perfil.direccion.principal');
        Route::delete('/direccion/{id}', 'destroyDireccion')->name('perfil.direccion.destroy');
        
        // Tarjetas y Cuenta
        Route::post('/tarjetas', 'storeTarjeta')->name('perfil.tarjetas.store');
        Route::delete('/tarjetas/{id}', 'destroyTarjeta')->name('perfil.tarjetas.destroy');
        Route::post('/reembolso', 'updateDatosReembolso')->name('perfil.reembolso.update');
        Route::delete('/sesiones/{id}', 'destroySession')->name('perfil.sesiones.destroy');
        Route::delete('/cuenta', 'destroyAccount')->name('perfil.cuenta.destroy');
    });

    Route::controller(ListaDeseoController::class)->group(function () {
        Route::get('/wishlist/lists', 'getLists')->name('wishlist.lists');
        Route::post('/wishlist/toggle', 'toggleWishlist')->name('wishlist.toggle');
        Route::post('/wishlist/sync', 'syncWishlists')->name('wishlist.sync');
        Route::post('/perfil/listas', 'storeLista')->name('perfil.listas.store');
        Route::delete('/perfil/listas/{id}', 'destroyLista')->name('perfil.listas.destroy');
        Route::post('/perfil/listas/items', 'storeListaItem')->name('perfil.listas.items.store');
        Route::delete('/perfil/listas/items/{id}', 'destroyListaItem')->name('perfil.listas.items.destroy');
    });

    Route::get('/perfil/seguimiento', [ShippingController::class, 'trackPage'])->name('perfil.seguimiento');
    Route::get('/factura/ecommerce/{id}/descargar', [InvoiceController::class, 'descargarComprobante'])->name('factura.ecommerce.descargar');

    // Devoluciones / RMA
    Route::controller(\App\Http\Controllers\RmaRequestController::class)->group(function () {
        Route::get('/perfil/devoluciones', 'index')->name('perfil.rma.index');
        Route::post('/perfil/devoluciones', 'store')->name('perfil.rma.store');
        Route::get('/perfil/devoluciones/{id}', 'show')->name('perfil.rma.show');
    });
});

// ==========================================
// ADMIN DASHBOARD
// ==========================================

Route::controller(AdminAuthController::class)->prefix('admin')->group(function () {
    Route::get('/login', 'showLogin')->name('admin.login')->middleware('guest:admin');
    Route::post('/login', 'login')->middleware('guest:admin');
    Route::any('/logout', 'logout')->name('admin.logout')->middleware('auth:admin');
});

Route::prefix('admin')->middleware(['auth:admin'])->group(function () {

    Route::controller(DashboardController::class)->group(function () {
        Route::get('/', 'dashboard')->name('admin.dashboard')->middleware('permiso:ver_dashboard');
        Route::get('/pedidos/exportar-pdf', 'exportarPdf')->name('admin.pedidos.exportar_pdf')->middleware('permiso:ver_dashboard');
        Route::get('/pedidos/exportar-excel', 'exportarExcel')->name('admin.pedidos.exportar_excel')->middleware('permiso:ver_dashboard');
        Route::get('/buscar', 'globalSearch')->name('admin.buscar');
    });

    Route::get('/analiticas', [AnaliticasController::class, 'index'])->name('admin.analiticas')->middleware('permiso:ver_dashboard');

    Route::get('/audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index'])->name('admin.audits')->middleware('permiso:ver_dashboard');

    // Notificaciones
    Route::controller(\App\Http\Controllers\Admin\NotificationController::class)->prefix('notificaciones')->group(function () {
        Route::get('/', 'index')->name('admin.notificaciones');
        Route::post('/{id}/read', 'markAsRead')->name('admin.notificaciones.read');
        Route::post('/read-all', 'markAllAsRead')->name('admin.notificaciones.read_all');
    });

    // Importación de Clientes
    Route::controller(\App\Http\Controllers\Admin\CustomerImportController::class)->prefix('clientes/importar')->middleware('permiso:usuarios.gestionar')->group(function () {
        Route::get('/', 'index')->name('admin.clientes.import');
        Route::post('/preview', 'preview')->name('admin.clientes.import.preview');
        Route::post('/process', 'process')->name('admin.clientes.import.process');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmDashboardController::class)->prefix('crm')->group(function () {
        Route::get('/dashboard', 'index')->name('admin.crm.dashboard');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmCustomFieldController::class)->prefix('crm/custom-fields')->group(function () {
        Route::get('/', 'index')->name('admin.crm.custom_fields.index');
        Route::post('/', 'store')->name('admin.crm.custom_fields.store');
        Route::delete('/{customField}', 'destroy')->name('admin.crm.custom_fields.destroy');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmTaskController::class)->prefix('crm')->group(function () {
        Route::get('/tasks', 'index')->name('admin.crm.tasks');
        Route::post('/tasks', 'store')->name('admin.crm.tasks.store');
        Route::put('/tasks/{activity}', 'update')->name('admin.crm.tasks.update');
        Route::post('/tasks/{activity}/complete', 'complete')->name('admin.crm.tasks.complete');
        Route::delete('/tasks/{activity}', 'destroy')->name('admin.crm.tasks.destroy');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmSearchController::class)->prefix('crm')->group(function () {
        Route::get('/search', 'search')->name('admin.crm.search');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmCaseController::class)->prefix('crm')->group(function () {
        Route::get('/cases', 'index')->name('admin.crm.cases');
        Route::post('/cases', 'store')->name('admin.crm.cases.store');
        Route::get('/cases/{crmCase}', 'show')->name('admin.crm.cases.show');
        Route::put('/cases/{crmCase}', 'update')->name('admin.crm.cases.update');
        Route::post('/cases/{crmCase}/notes', 'addNote')->name('admin.crm.cases.notes.store');
        Route::delete('/cases/{crmCase}', 'destroy')->name('admin.crm.cases.destroy');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmCalendarController::class)->prefix('crm')->group(function () {
        Route::get('/calendar', 'index')->name('admin.crm.calendar');
        Route::get('/calendar/events', 'events')->name('admin.crm.calendar.events');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmExportController::class)->prefix('crm')->group(function () {
        Route::get('/export', 'export')->name('admin.crm.export');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmAutomationController::class)->prefix('crm/automations')->group(function () {
        Route::get('/', 'index')->name('admin.crm.automations.index');
        Route::post('/', 'store')->name('admin.crm.automations.store');
        Route::delete('/{id}', 'destroy')->name('admin.crm.automations.destroy');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmPipelineController::class)->prefix('crm')->group(function () {
        Route::get('/pipeline', 'index')->name('admin.crm.pipeline');
        Route::post('/deals', 'store')->name('admin.crm.deals.store');
        Route::put('/deals/{id}/move', 'move')->name('admin.crm.deals.move');
        Route::get('/deals/{id}', 'show')->name('admin.crm.deals.show');
        Route::post('/deals/{id}/custom-fields', 'updateCustomFields')->name('admin.crm.deals.updateCustomFields');
        Route::post('/deals/{id}/activities', 'storeActivity')->name('admin.crm.deals.activities.store');
        
        // Cotizador Integrado
        Route::post('/deals/{id}/products', 'addProduct')->name('admin.crm.deals.products.add');
        Route::delete('/deals/{id}/products/{productId}', 'removeProduct')->name('admin.crm.deals.products.remove');
        Route::get('/deals/{id}/quote', 'generateQuote')->name('admin.crm.deals.quote');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmCompanyController::class)->prefix('crm/companies')->group(function () {
        Route::get('/', 'index')->name('admin.crm.companies.index');
        Route::post('/', 'store')->name('admin.crm.companies.store');
        Route::get('/{id}', 'show')->name('admin.crm.companies.show');
        Route::put('/{id}', 'update')->name('admin.crm.companies.update');
        Route::delete('/{id}', 'destroy')->name('admin.crm.companies.destroy');
    });

    Route::controller(\App\Http\Controllers\Admin\CrmSettingsController::class)->prefix('crm/settings')->group(function () {
        Route::get('/objects', 'objects')->name('admin.crm.settings.objects');
        Route::post('/objects/fields', 'storeField')->name('admin.crm.settings.fields.store');
        Route::delete('/objects/fields/{id}', 'destroyField')->name('admin.crm.settings.fields.destroy');
        Route::post('/evidence/{id}/resolve', 'resolveEvidence')->name('admin.crm.settings.evidence.resolve');
    });

    // Devoluciones / RMA
    Route::controller(\App\Http\Controllers\Admin\RmaRequestController::class)->prefix('rma')->group(function () {
        Route::get('/', 'index')->name('admin.rma.index');
        Route::get('/{id}', 'show')->name('admin.rma.show');
        Route::put('/{id}/status', 'updateStatus')->name('admin.rma.update_status');
    });

    // Marketing Cloud
    Route::controller(\App\Http\Controllers\Admin\MarketingCampaignController::class)->prefix('marketing/campaigns')->group(function () {
        Route::get('/', 'index')->name('admin.marketing.campaigns');
        Route::get('/create', 'create')->name('admin.marketing.campaigns.create');
        Route::post('/', 'store')->name('admin.marketing.campaigns.store');
        Route::post('/{campaign}/send', 'send')->name('admin.marketing.campaigns.send');
    });

    Route::post('/clientes/{id}/notas', [\App\Http\Controllers\Admin\CustomerController::class, 'storeNota'])->name('admin.clientes.notas.store');

    Route::controller(AlmacenController::class)->prefix('almacenes')->group(function () {
        Route::get('/', 'index')->name('admin.almacenes.index');
        Route::post('/', 'store')->name('admin.almacenes.store');
        Route::post('/transferir', 'transferir')->name('admin.almacenes.transferir');
        Route::get('/{id}/kardex', 'kardex')->name('admin.almacenes.kardex');
        Route::delete('/{id}', 'destroy')->name('admin.almacenes.destroy');
    });

    Route::controller(GastoController::class)->prefix('gastos')->group(function () {
        Route::get('/', 'index')->name('admin.gastos.index');
        Route::post('/', 'store')->name('admin.gastos.store');
        Route::put('/{id}', 'update')->name('admin.gastos.update');
        Route::delete('/{id}', 'destroy')->name('admin.gastos.destroy');
    });

    Route::controller(ProductController::class)->prefix('products')->group(function () {
        Route::get('/', 'index')->name('admin.products')->middleware('permiso:ver_productos');
        Route::get('/create', 'create')->name('admin.products.create')->middleware('permiso:crear_producto');
        Route::post('/', 'store')->name('admin.products.store')->middleware('permiso:crear_producto');
        Route::get('/exportar', 'export')->name('admin.exportar.productos')->middleware('permiso:ver_productos');
        Route::get('/{id}', 'show')->name('admin.products.show')->where('id', '[0-9]+')->middleware('permiso:ver_productos');
        Route::get('/{id}/edit', 'edit')->name('admin.products.edit')->middleware('permiso:editar_producto');
        Route::put('/{id}', 'update')->name('admin.products.update')->middleware('permiso:editar_producto');
        Route::delete('/{id}', 'destroy')->name('admin.products.destroy')->middleware('permiso:eliminar_producto');
    });

    Route::controller(CategoryController::class)->prefix('categorias')->middleware('permiso:gestionar_categorias')->group(function () {
        Route::get('/', 'index')->name('admin.categorias');
        Route::get('/create', 'create')->name('admin.categorias.create');
        Route::post('/', 'store')->name('admin.categorias.store');
        Route::post('/api', 'storeApi')->name('api.categorias.store');
        Route::get('/{id}/edit', 'edit')->name('admin.categorias.edit');
        Route::put('/{id}', 'update')->name('admin.categorias.update');
        Route::delete('/{id}', 'destroy')->name('admin.categorias.destroy');
    });

    Route::controller(PosController::class)->prefix('pos')->middleware('permiso:pos.vender')->group(function () {
        Route::get('/', 'index')->name('admin.pos');
        Route::get('/buscar-productos', 'buscarProductos')->name('admin.pos.buscar_productos');
        Route::get('/historial', 'historial')->name('admin.pos.historial');
        Route::post('/venta', 'registrarVenta')->name('admin.pos.venta');
        Route::get('/buscar-cliente', 'buscarCliente')->name('admin.pos.buscar_cliente');
    });

    Route::controller(AdminInvoiceController::class)->middleware('permiso:pos.vender')->group(function () {
        Route::get('/pos/ticket/{id}', 'generarFacturaPos')->name('admin.pos.ticket');
        Route::get('/factura/{id}/descargar', 'generarFacturaPos')->name('admin.factura.descargar');
    });

    Route::controller(CajaController::class)->prefix('caja')->group(function () {
        Route::post('/aperturar', 'aperturar')->name('admin.caja.aperturar');
        Route::post('/cerrar', 'cerrar')->name('admin.caja.cerrar');
        Route::post('/movimiento', 'movimiento')->name('admin.caja.movimiento');
    });

    Route::controller(CompraController::class)->prefix('compras')->group(function () {
        Route::get('/', 'index')->name('admin.compras.index');
        Route::post('/', 'store')->name('admin.compras.store');
        Route::post('/{id}/completar', 'completar')->name('admin.compras.completar');
        Route::get('/{id}', 'show')->name('admin.compras.show');
        Route::delete('/{id}', 'destroy')->name('admin.compras.destroy');
    });

    Route::get('/inventario', [InventarioController::class, 'dashboard'])->name('admin.inventario');

    Route::controller(ZonaController::class)->prefix('zonas')->group(function () {
        Route::get('/', 'index')->name('admin.zonas.index');
        Route::post('/', 'store')->name('admin.zonas.store');
        Route::put('/{id}', 'update')->name('admin.zonas.update');
        Route::delete('/{id}', 'destroy')->name('admin.zonas.destroy');
    });

    Route::controller(MetodoPagoController::class)->prefix('metodos-pago')->group(function () {
        Route::get('/', 'index')->name('admin.metodospago.index');
        Route::post('/', 'store')->name('admin.metodospago.store');
        Route::put('/{id}', 'update')->name('admin.metodospago.update');
        Route::delete('/{id}', 'destroy')->name('admin.metodospago.destroy');
    });

    Route::controller(BrandController::class)->prefix('marcas')->middleware('permiso:gestionar_marcas')->group(function () {
        Route::get('/', 'index')->name('admin.marcas');
        Route::get('/create', 'create')->name('admin.marcas.create');
        Route::post('/', 'store')->name('admin.marcas.store');
        Route::get('/{id}/edit', 'edit')->name('admin.marcas.edit');
        Route::put('/{id}', 'update')->name('admin.marcas.update');
        Route::delete('/{id}', 'destroy')->name('admin.marcas.destroy');
    });

    Route::resource('proveedores', ProveedorController::class)->middleware('permiso:ver_productos');
    Route::resource('cupones', CuponController::class)->middleware('permiso:gestionar_cupones');

    Route::controller(OrderController::class)->prefix('pedidos')->group(function () {
        Route::get('/', 'index')->name('admin.pedidos')->middleware('permiso:ver_pedidos');
        Route::get('/exportar', 'export')->name('admin.exportar.pedidos')->middleware('permiso:ver_pedidos');
        Route::get('/{id}', 'show')->name('admin.pedidos.show')->middleware('permiso:ver_pedidos');
        Route::get('/{id}/factura', 'facturaVista')->name('admin.pedidos.factura')->middleware('permiso:ver_pedidos');
        Route::put('/{id}/estado', 'updateEstado')->name('admin.pedidos.update_estado')->middleware('permiso:editar_pedido');
        Route::post('/{id}/reembolsar', 'reembolsar')->name('admin.pedidos.reembolsar')->middleware('permiso:editar_pedido');
    });

    Route::controller(SettingController::class)->prefix('ajustes')->middleware('permiso:gestionar_ajustes')->group(function () {
        Route::get('/', 'index')->name('admin.ajustes');
        Route::post('/', 'update')->name('admin.ajustes.update');
        Route::get('/permisos', 'rolesIndex')->name('admin.roles.index');
        Route::post('/permisos/sync', 'rolesSyncPermisos')->name('admin.roles.sync');
        Route::post('/roles', 'storeRole')->name('admin.ajustes.roles.store');
        Route::delete('/roles/{id}', 'destroyRole')->name('admin.ajustes.roles.destroy');
    });

    Route::controller(BannerController::class)->prefix('banners')->middleware('permiso:gestionar_ajustes')->group(function () {
        Route::get('/', 'index')->name('admin.banners.index');
        Route::post('/', 'store')->name('admin.banners.store');
        Route::post('/{id}', 'update')->name('admin.banners.update');
        Route::delete('/{id}', 'destroy')->name('admin.banners.destroy');
    });

    Route::controller(CustomerController::class)->prefix('clientes')->group(function () {
        Route::get('/', 'index')->name('admin.clientes')->middleware('permiso:ver_usuarios');
        Route::get('/exportar', 'export')->name('admin.exportar.clientes')->middleware('permiso:ver_usuarios');
        Route::get('/create', 'create')->name('admin.clientes.create')->middleware('permiso:editar_usuario');

        Route::post('/', 'store')->name('admin.clientes.store')->middleware('permiso:editar_usuario');
        Route::post('/bulk-delete', 'bulkDestroy')->name('admin.clientes.bulk_destroy')->middleware('permiso:editar_usuario');
        Route::get('/{id}', 'show')->name('admin.clientes.show')->middleware('permiso:usuarios.gestionar');
        Route::get('/{id}/api-profile', 'apiProfile')->name('admin.clientes.api_profile')->middleware('permiso:usuarios.gestionar');
        Route::get('/{id}/edit', 'edit')->name('admin.clientes.edit')->middleware('permiso:editar_usuario');
        Route::put('/{id}', 'update')->name('admin.clientes.update')->middleware('permiso:editar_usuario');
        Route::delete('/{id}', 'destroy')->name('admin.clientes.destroy')->middleware('permiso:editar_usuario');
        Route::post('/{id}/bloquear', 'toggleBloqueo')->name('admin.clientes.bloquear')->middleware('permiso:editar_usuario');
        Route::post('/{id}/reset-password', 'resetPassword')->name('admin.clientes.reset_password')->middleware('permiso:editar_usuario');
        Route::post('/{id}/notas', 'storeNota')->name('admin.clientes.notas.store')->middleware('permiso:editar_usuario');
        Route::delete('/{id}/notas/{notaId}', 'destroyNota')->name('admin.clientes.notas.destroy')->middleware('permiso:editar_usuario');
    });

    Route::controller(StaffController::class)->prefix('trabajadores')->group(function () {
        Route::get('/', 'index')->name('admin.trabajadores')->middleware('permiso:ver_usuarios');
        Route::get('/exportar', 'export')->name('admin.exportar.trabajadores')->middleware('permiso:ver_usuarios');
        Route::get('/create', 'create')->name('admin.trabajadores.create')->middleware('permiso:editar_usuario');
        Route::post('/', 'store')->name('admin.trabajadores.store')->middleware('permiso:editar_usuario');
        Route::get('/{id}', 'show')->name('admin.trabajadores.show')->middleware('permiso:usuarios.gestionar');
        Route::get('/{id}/edit', 'edit')->name('admin.trabajadores.edit')->middleware('permiso:editar_usuario');
        Route::put('/{id}', 'update')->name('admin.trabajadores.update')->middleware('permiso:editar_usuario');
        Route::delete('/{id}', 'destroy')->name('admin.trabajadores.destroy')->middleware('permiso:editar_usuario');
        Route::post('/{id}/bloquear', 'toggleBloqueo')->name('admin.trabajadores.bloquear')->middleware('permiso:editar_usuario');
        Route::post('/{id}/reset-password', 'resetPassword')->name('admin.trabajadores.reset_password')->middleware('permiso:editar_usuario');
    });

    Route::controller(RoleController::class)->prefix('roles')->middleware('permiso:usuarios.gestionar')->group(function () {
        Route::get('/', 'index')->name('admin.roles');
        Route::get('/create', 'create')->name('admin.roles.create');
        Route::post('/', 'store')->name('admin.roles.store');
        Route::get('/{id}/edit', 'edit')->name('admin.roles.edit');
        Route::put('/{id}', 'update')->name('admin.roles.update');
        Route::delete('/{id}', 'destroy')->name('admin.roles.destroy');
    });

    // ==========================================
    // OMNICHANNEL INBOX
    // ==========================================
    Route::middleware(['permiso:gestionar_omnichannel'])->group(function () {
        Route::get('/inbox', [\App\Http\Controllers\Admin\Omnichannel\InboxController::class, 'index'])->name('admin.inbox');

        // API del Inbox (JSON, usadas por React via fetch)
        Route::prefix('api/omnichannel')->group(function () {
            Route::get('/conversations', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'conversations']);
            Route::get('/conversations/{conversation}/messages', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'messages']);
            Route::post('/conversations/{conversation}/messages', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'sendMessage'])->middleware('throttle:30,1');
            Route::post('/conversations/{conversation}/assign', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'assignAgent']);
            Route::post('/conversations/{conversation}/unassign', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'unassignAgent']);
            Route::post('/conversations/{conversation}/resolve', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'resolveConversation']);
            Route::post('/conversations/{conversation}/reopen', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'reopenConversation']);
            Route::post('/conversations/{conversation}/transfer-to-bot', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'transferToBot']);
            Route::post('/conversations/{conversation}/notes', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'addInternalNote']);
            Route::get('/conversations/{conversation}/contact-profile', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'contactProfile']);
            Route::get('/canned-responses', [\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class, 'cannedResponses']);
        });
    });
});

// ==========================================
// WEBHOOKS OMNICHANNEL (Público — sin auth)
// ==========================================
Route::prefix('api/webhooks')->group(function () {
    Route::get('/whatsapp', [\App\Http\Controllers\Api\Omnichannel\WhatsAppWebhookController::class, 'verify']);
    Route::post('/whatsapp', [\App\Http\Controllers\Api\Omnichannel\WhatsAppWebhookController::class, 'handle']);
});

