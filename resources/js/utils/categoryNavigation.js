export const normalizeLabel = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function filterCategoryTree(categories, search) {
    const term = normalizeLabel(search.trim());
    if (!term) return categories;
    return categories.flatMap(category => {
        if (normalizeLabel(category.nombre).includes(term)) return [category];
        const children = filterCategoryTree(category.subcategorias || [], term);
        return children.length ? [{ ...category, subcategorias: children }] : [];
    });
}
