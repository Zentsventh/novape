import React from 'react';
import { Link } from '@inertiajs/react';
import { useDeviceContext } from '@/Contexts/DeviceContext';
import { Home, Search, ShoppingCart, User, Menu } from 'lucide-react';
import '../../../css/home/mobile-nav.css';

export default function MobileBottomNav({ user, cart }) {
    const { isMobile, isTablet } = useDeviceContext();
    const cartCount = cart?.count || 0;

    if (!isMobile && !isTablet) return null;

    const openCart = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-cart'));
    };

    const openCategories = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-categories'));
    };

    return (
        <nav className="efe-mobile-bottom-nav">
            <Link href="/" className="nav-item">
                <Home size={22} strokeWidth={1.5} />
                <span>Inicio</span>
            </Link>

            <button type="button" className="nav-item" onClick={openCategories}>
                <Menu size={22} strokeWidth={1.5} />
                <span>Categorías</span>
            </button>

            <Link href="/catalogo" className="nav-item">
                <Search size={22} strokeWidth={1.5} />
                <span>Buscar</span>
            </Link>

            {user ? (
                <Link href="/perfil" className="nav-item">
                    <User size={22} strokeWidth={1.5} />
                    <span>Mi Cuenta</span>
                </Link>
            ) : (
                <Link href="/?login=1" className="nav-item">
                    <User size={22} strokeWidth={1.5} />
                    <span>Ingresar</span>
                </Link>
            )}

            <button type="button" className="nav-item" onClick={openCart}>
                <div className="cart-icon-wrapper">
                    <ShoppingCart size={22} strokeWidth={1.5} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </div>
                <span>Carrito</span>
            </button>
        </nav>
    );
}
