import { ingredientsList } from './ingredientsList';

export function getVendorCatalog() {
  const stored = localStorage.getItem('toqueworks_vendor_catalog');
  return stored ? JSON.parse(stored) : ingredientsList;
}

export function saveVendorCatalog(catalog) {
  localStorage.setItem('toqueworks_vendor_catalog', JSON.stringify(catalog));
}

export function updateItemPrice(itemId, newPrice) {
  const catalog = getVendorCatalog();
  const item = catalog.find(i => i.id === itemId);
  if (item) {
    item.unitPrice = newPrice;
    saveVendorCatalog(catalog);
  }
  return catalog;
}

export function updateItem(itemId, updates) {
  const catalog = getVendorCatalog();
  const index = catalog.findIndex(i => i.id === itemId);
  if (index !== -1) {
    catalog[index] = { ...catalog[index], ...updates };
    saveVendorCatalog(catalog);
  }
  return catalog;
}

export function addItem(item) {
  const catalog = getVendorCatalog();
  catalog.push(item);
  saveVendorCatalog(catalog);
  return catalog;
}

export function resetCatalog() {
  localStorage.removeItem('toqueworks_vendor_catalog');
  return ingredientsList;
}
