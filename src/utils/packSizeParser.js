const UNIT_CONVERSIONS = { GAL: 128, QT: 32, PT: 16, LB: 16, OZ: 1, KG: 35.274, G: 0.035274, L: 33.814, ML: 0.033814, EA: 1, CT: 1, DOZ: 12, PK: 1 };

export function parsePackSize(packSize, recipeUnit) {
  if (!packSize) return null;
  recipeUnit = recipeUnit || "oz";
  
  const normalized = packSize.toUpperCase().replace(/\s+/g, "");
  
  let count = 1, size = 1, packUnit = "EA";
  
  let match = normalized.match(/^(\d+)\/(\d*\.?\d+)(GAL|QT|PT|LB|OZ|KG|G|L|ML|DOZ|EA|CT|PK)S?$/i);
  if (match) {
    count = parseFloat(match[1]);
    size = parseFloat(match[2]);
    packUnit = match[3].toUpperCase();
  }
  
  if (!match) {
    match = normalized.match(/^(\d*\.?\d+)(GAL|QT|PT|LB|OZ|KG|G|L|ML|DOZ|EA|CT|PK)S?$/i);
    if (match) {
      size = parseFloat(match[1]);
      packUnit = match[2].toUpperCase();
    }
  }
  
  if (!match) {
    match = normalized.match(/^(\d+)\/(\d*\.?\d+)\/(GAL|QT|PT|LB|OZ|KG|G|L|ML|DOZ|EA|CT|PK)S?$/i);
    if (match) {
      count = parseFloat(match[1]);
      size = parseFloat(match[2]);
      packUnit = match[3].toUpperCase();
    }
  }
  
  if (!match) {
    match = normalized.match(/^(\d*\.?\d+)(GAL|QT|PT|LB|OZ|KG|G|L|ML|DOZ|EA|CT|PK)\/(\d*\.?\d+)(GAL|QT|PT|LB|OZ|KG|G|L|ML|DOZ|EA|CT|PK)$/i);
    if (match) {
      count = parseFloat(match[3]);
      size = 1;
      packUnit = match[4].toUpperCase();
    }
  }
  
  if (!match) {
    match = normalized.match(/^(\d+)$/);
    if (match) {
      count = parseFloat(match[1]);
      size = 1;
      packUnit = "EA";
    }
  }

  if (packUnit === 'DOZ' || packUnit === 'EA' || packUnit === 'CT' || packUnit === 'PK') {
    const totalUnits = count * size;
    return { count, size, packUnit, totalOz: totalUnits, totalRecipeUnits: totalUnits };
  }

  const conversionFactor = UNIT_CONVERSIONS[packUnit] || 1;
  const totalOz = count * size * conversionFactor;
  const recipeConversion = UNIT_CONVERSIONS[recipeUnit.toUpperCase()] || 1;
  return { count, size, packUnit, totalOz, totalRecipeUnits: totalOz / recipeConversion };
}

export function calculateUnitPrice(casePrice, packSize, recipeUnit) {
  const parsed = parsePackSize(packSize, recipeUnit);
  if (!parsed || !casePrice) return null;
  
  const recipeUnitUpper = (recipeUnit || '').toUpperCase().replace(/\s+/g, '');
  
  // Handle count-based pack units (EA, CT, DOZ, PK)
  if (['EA', 'CT', 'DOZ', 'PK'].includes(parsed.packUnit)) {
    return Math.round((casePrice / parsed.totalRecipeUnits) * 10000) / 10000;
  }
  
  // Handle "can", "jar", "bottle", "bag", "box" units - divide by container count
  if (['CAN', 'JAR', 'BOTTLE', 'BAG', 'BOX', 'EA', 'EACH'].includes(recipeUnitUpper) ||
      recipeUnitUpper.endsWith('CAN') || recipeUnitUpper.endsWith('JAR')) {
    // For "24/6OZ" with unit "can" -> $29.59 / 24 = $1.23 per can
    return Math.round((casePrice / parsed.count) * 10000) / 10000;
  }
  
  // Check if recipe unit matches pack portion (e.g., "4oz" with 40/4OZ -> divide by 40)
  const portionMatch = recipeUnitUpper.match(/^(\d*\.?\d+)(OZ|LB|G|KG|ML|L|GAL|QT|PT)$/);
  if (portionMatch) {
    const portionSize = parseFloat(portionMatch[1]);
    const portionUnit = portionMatch[2];
    if (portionSize === parsed.size && portionUnit === parsed.packUnit) {
      return Math.round((casePrice / parsed.count) * 10000) / 10000;
    }
  }
  
  return Math.round((casePrice / parsed.totalRecipeUnits) * 10000) / 10000;
}
