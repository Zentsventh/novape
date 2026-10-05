# Novape E‑Commerce Platform

## Vision
A **enterprise‑grade** e‑commerce platform built with **Laravel** using **Domain‑Driven Design (DDD)**. The architecture separates concerns into clear domains, supports rich business logic, robust automation, AI assistance, and a premium UI.

## High‑Level Structure
```
app/
├─ Domain/
│  ├─ Catalog/       # Productos, categorías, marcas, variantes, atributos
│  ├─ Inventory/     # Stock, almacenes, movimientos, kardex
│  ├─ Sales/         # Pedidos, checkout, historial, comparador
│  ├─ Payments/      # Métodos, transacciones, webhooks, conciliación
│  ├─ Customers/     # Registro, perfil, direcciones, CRM, fidelización
│  ├─ CRM/           # Conversaciones, tickets, notas, asignaciones
│  ├─ Marketing/     # Campañas, cupones, automatizaciones, IA
│  ├─ Procurement/   # Solicitudes, cotizaciones, órdenes de compra
│  ├─ Billing/       # Facturación electrónica (SUNAT), comprobantes
│  ├─ Automation/    # Motor de reglas, programaciones, notificaciones
│  └─ AI/            # Asistente administrativo, generación de contenido
├─ Actions/          # Use‑case / application services
├─ Services/         # Infra‑estructuras (email, payment gateways, AI)
├─ Events/           # Domain events
├─ Listeners/        # Event listeners
├─ Jobs/             # Queued jobs (emails, imports, IA)
├─ Policies/         # Authorization policies (modulo.recurso.accion)
└─ Notifications/    # Laravel notifications (email, SMS, push)
```

## Core Decisions (Senior‑Level)
- **Laravel 11** with PHP 8.3 – latest LTS features, type‑safe models, route attributes.
- **DDD** – each domain has its own `Entities`, `ValueObjects`, `Repositories` and `Services`.
- **CQRS** – Commands for write‑side, Queries for read‑side (via dedicated query classes).
- **Event‑Sourcing** – critical actions (order status changes, payments) emit events stored in `events` table.
- **Hexagonal Architecture** – `Domain` core is independent of Laravel, enabling easy testing and future migration.
- **API‑first** – All features exposed through a versioned REST/GraphQL API (`/api/v1`).
- **Security** – JWT + Laravel Sanctum for API, 2FA for admin, granular permissions (`module.resource.action`).
- **CI/CD** – GitHub Actions pipeline (lint, phpstan, tests, Docker build, deployment).
- **Docker** – Multi‑stage build with PHP‑FPM, Nginx, MySQL, Redis, Horizon.
- **Testing** – PestPHP + PHPUnit, 100 % coverage on core domain logic.
- **AI Integration** – OpenAI SDK wrapper under `App\Domain\AI\Services\OpenAIService`.

## Immediate Next Steps (implemented now)
1. Create the **DDD folder skeleton**.
2. Add a base **Entity** class with UUID primary key.
3. Scaffold a **Product** entity (Catalog domain) with migrations placeholder.
4. Provide a **README** with onboarding instructions.
5. Add a minimal **composer.json** and **.gitignore**.
6. Commit these files – the project is ready for further development.

## How to Continue
- Run `composer install` to fetch Laravel dependencies.
- Execute `php artisan migrate` after generating migrations for each domain.
- Implement API resources, request validation, and service classes per domain.
- Extend the UI layer (Vue 3 + Vite) with a premium dashboard (glass‑morphism, dark mode).

---
*All decisions were taken to ensure scalability, maintainability, and a premium user experience.*

# Datos de catálogo y demostración

La carga de 200 clientes, catálogo de EFE e imágenes locales y un mes de operaciones simuladas está documentada en [docs/SEMILLAS_REALES.md](docs/SEMILLAS_REALES.md).
