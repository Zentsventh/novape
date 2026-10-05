<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\Usuario;

class ProductPolicy
{
    /**
     * Determine whether the user can view any products.
     */
    public function viewAny(Usuario $user): bool
    {
        return true; // public catalog
    }

    /**
     * Determine whether the user can view the product.
     */
    public function view(Usuario $user, Producto $product): bool
    {
        return true; // everyone can see product details
    }

    /**
     * Determine whether the user can create products.
     */
    public function create(Usuario $user): bool
    {
        // Assuming a role column or permission system; here we check admin role
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the product.
     */
    public function update(Usuario $user, Producto $product): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the product.
     */
    public function delete(Usuario $user, Producto $product): bool
    {
        return $user->hasRole('admin');
    }
}
?>
