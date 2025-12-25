// Sample Quick Breads Recipe Data
// CUL 140 Week 3: Quick Breads

export const quickBreadsRecipes = [
  {
    id: 'qb-001',
    name: 'Buttermilk Biscuits',
    servings: 16,
    category: 'Quick Breads',
    week: 3,
    course: 'CUL 140',
    ingredients: [
      { name: 'All-purpose flour', quantity: 2, unit: 'cups', shamrockCode: 'FLR-001' },
      { name: 'Baking powder', quantity: 1, unit: 'tbsp', shamrockCode: 'BAK-001' },
      { name: 'Salt', quantity: 1, unit: 'tsp', shamrockCode: 'SLT-001' },
      { name: 'Butter, cold', quantity: 0.5, unit: 'cup', shamrockCode: 'DAI-001' },
      { name: 'Buttermilk', quantity: 0.75, unit: 'cup', shamrockCode: 'DAI-005' },
    ]
  },
  {
    id: 'qb-002',
    name: 'Cheddar Scones',
    servings: 12,
    category: 'Quick Breads',
    week: 3,
    course: 'CUL 140',
    ingredients: [
      { name: 'All-purpose flour', quantity: 2.5, unit: 'cups', shamrockCode: 'FLR-001' },
      { name: 'Baking powder', quantity: 1, unit: 'tbsp', shamrockCode: 'BAK-001' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', shamrockCode: 'SLT-001' },
      { name: 'Butter, cold', quantity: 0.5, unit: 'cup', shamrockCode: 'DAI-001' },
      { name: 'Cheddar cheese, shredded', quantity: 1, unit: 'cup', shamrockCode: 'DAI-006' },
      { name: 'Heavy cream', quantity: 0.75, unit: 'cup', shamrockCode: 'DAI-003' },
      { name: 'Eggs', quantity: 1, unit: 'each', shamrockCode: 'DAI-002' },
    ]
  },
  {
    id: 'qb-003',
    name: 'Irish Soda Bread',
    servings: 8,
    category: 'Quick Breads',
    week: 3,
    course: 'CUL 140',
    ingredients: [
      { name: 'All-purpose flour', quantity: 4, unit: 'cups', shamrockCode: 'FLR-001' },
      { name: 'Baking soda', quantity: 1, unit: 'tsp', shamrockCode: 'BAK-002' },
      { name: 'Salt', quantity: 1, unit: 'tsp', shamrockCode: 'SLT-001' },
      { name: 'Buttermilk', quantity: 1.75, unit: 'cups', shamrockCode: 'DAI-005' },
      { name: 'Raisins', quantity: 1, unit: 'cup', shamrockCode: 'FRT-001' },
    ]
  },
  {
    id: 'qb-004',
    name: 'Blueberry Muffins',
    servings: 24,
    category: 'Quick Breads',
    week: 3,
    course: 'CUL 140',
    ingredients: [
      { name: 'All-purpose flour', quantity: 3, unit: 'cups', shamrockCode: 'FLR-001' },
      { name: 'Baking powder', quantity: 2, unit: 'tbsp', shamrockCode: 'BAK-001' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', shamrockCode: 'SLT-001' },
      { name: 'Butter, melted', quantity: 0.5, unit: 'cup', shamrockCode: 'DAI-001' },
      { name: 'Sugar, granulated', quantity: 1, unit: 'cup', shamrockCode: 'SUG-001' },
      { name: 'Eggs', quantity: 2, unit: 'each', shamrockCode: 'DAI-002' },
      { name: 'Milk, whole', quantity: 1, unit: 'cup', shamrockCode: 'DAI-004' },
      { name: 'Blueberries, fresh', quantity: 2, unit: 'cups', shamrockCode: 'FRT-002' },
    ]
  }
];

// Utility function to scale recipe ingredients
export function scaleRecipe(recipe, servingsNeeded) {
  const scaleFactor = servingsNeeded / recipe.servings;
  
  return {
    ...recipe,
    scaledServings: servingsNeeded,
    scaleFactor: scaleFactor,
    ingredients: recipe.ingredients.map(ing => ({
      ...ing,
      scaledQuantity: ing.quantity * scaleFactor
    }))
  };
}
