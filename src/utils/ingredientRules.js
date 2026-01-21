/**
 * Ingredient Rules Utility
 * Checks ingredients against substitution rules and expands sub-recipes
 */

import { supabase } from '../lib/supabase';

/**
 * Check if an ingredient has a rule (substitute, use_fresh, make_in_house)
 * @param {string} ingredientName - The ingredient to check
 * @returns {object|null} - The rule if found, null otherwise
 */
export async function checkIngredientRule(ingredientName) {
  const { data, error } = await supabase
    .from('ingredient_rules')
    .select('*')
    .eq('is_active', true)
    .ilike('requested_item', ingredientName)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking ingredient rule:', error);
  }

  return data || null;
}

/**
 * Get all active ingredient rules
 * @returns {array} - All active rules
 */
export async function getAllIngredientRules() {
  const { data, error } = await supabase
    .from('ingredient_rules')
    .select('*')
    .eq('is_active', true)
    .order('requested_item');

  if (error) {
    console.error('Error fetching ingredient rules:', error);
    return [];
  }

  return data || [];
}

/**
 * Expand a sub-recipe into its component ingredients
 * @param {string} recipeName - The sub-recipe name
 * @param {number} scale - Scale factor (default 1.0)
 * @returns {array} - Array of ingredients with amounts
 */
export async function expandSubRecipe(recipeName, scale = 1.0) {
  const { data, error } = await supabase
    .from('sub_recipes')
    .select(`
      id,
      name,
      source,
      yield_amount,
      yield_unit,
      sub_recipe_ingredients (
        ingredient_name,
        amount,
        unit,
        sort_order
      )
    `)
    .ilike('name', recipeName)
    .single();

  if (error) {
    console.error('Error expanding sub-recipe:', error);
    return [];
  }

  if (!data || !data.sub_recipe_ingredients) {
    return [];
  }

  return data.sub_recipe_ingredients
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(ing => ({
      ingredient_name: ing.ingredient_name,
      amount: parseFloat((ing.amount * scale).toFixed(3)),
      unit: ing.unit,
      from_sub_recipe: data.name,
      source: data.source
    }));
}

/**
 * Calculate fresh citrus needed for juice
 * @param {string} fruit - 'Lemon' or 'Lime'
 * @param {number} juiceOz - Amount of juice needed in oz
 * @returns {object} - { count, ingredient_name }
 */
export function calculateFreshCitrus(fruit, juiceOz) {
  const yields = {
    'Lemon': { oz: 1.0, ingredient: 'Lemons, Fresh' },
    'Lime': { oz: 0.75, ingredient: 'Limes, Fresh' },
    'Orange': { oz: 3.0, ingredient: 'Oranges, Fresh' },
    'Grapefruit': { oz: 6.0, ingredient: 'Grapefruit, Fresh' }
  };

  const citrus = yields[fruit] || yields['Lemon'];
  const count = Math.ceil(juiceOz / citrus.oz);

  return {
    count,
    ingredient_name: citrus.ingredient,
    note: `For ${juiceOz} oz juice`
  };
}

/**
 * Process a list of ingredients through the rules engine
 * Returns processed ingredients and any flags for instructor confirmation
 * 
 * @param {array} ingredients - Array of { name, amount, unit }
 * @param {boolean} forInstructorConfirmation - If true, include confirmation messages
 * @returns {object} - { processedIngredients, flags }
 */
export async function processIngredientRules(ingredients, forInstructorConfirmation = false) {
  const rules = await getAllIngredientRules();
  const processedIngredients = [];
  const flags = [];

  for (const ingredient of ingredients) {
    // Find matching rule (case-insensitive)
    const rule = rules.find(r => 
      r.requested_item.toLowerCase() === ingredient.name.toLowerCase() ||
      ingredient.name.toLowerCase().includes(r.requested_item.toLowerCase())
    );

    if (!rule) {
      // No rule - keep ingredient as-is
      processedIngredients.push(ingredient);
      continue;
    }

    // Handle based on rule type
    switch (rule.rule_type) {
      case 'substitute':
        // Simple swap
        processedIngredients.push({
          ...ingredient,
          name: rule.substitute_item,
          original_name: ingredient.name,
          substituted: true
        });
        if (forInstructorConfirmation) {
          flags.push({
            type: 'substitute',
            original: ingredient.name,
            replacement: rule.substitute_item,
            message: rule.confirmation_message
          });
        }
        break;

      case 'use_fresh':
        // Calculate fresh citrus needed
        const fruit = ingredient.name.toLowerCase().includes('lemon') ? 'Lemon' : 'Lime';
        const juiceOz = parseFloat(ingredient.amount) || 4; // Default 4 oz if not specified
        const citrus = calculateFreshCitrus(fruit, juiceOz);
        
        processedIngredients.push({
          name: citrus.ingredient_name,
          amount: citrus.count,
          unit: 'ea',
          original_name: ingredient.name,
          note: citrus.note,
          use_fresh: true
        });
        if (forInstructorConfirmation) {
          flags.push({
            type: 'use_fresh',
            original: ingredient.name,
            replacement: `${citrus.count} ${citrus.ingredient_name}`,
            message: rule.confirmation_message
          });
        }
        break;

      case 'make_in_house':
        // Expand sub-recipe
        if (rule.recipe_name) {
          const subIngredients = await expandSubRecipe(rule.recipe_name);
          
          // Add all sub-recipe ingredients
          for (const subIng of subIngredients) {
            processedIngredients.push({
              name: subIng.ingredient_name,
              amount: subIng.amount,
              unit: subIng.unit,
              from_sub_recipe: subIng.from_sub_recipe,
              make_in_house: true
            });
          }
          
          if (forInstructorConfirmation) {
            flags.push({
              type: 'make_in_house',
              original: ingredient.name,
              recipe: rule.recipe_name,
              source: rule.recipe_source,
              ingredients: subIngredients.map(i => `${i.amount} ${i.unit} ${i.ingredient_name}`),
              message: rule.confirmation_message
            });
          }
        }
        break;

      case 'unavailable':
        // Skip ingredient entirely
        if (forInstructorConfirmation) {
          flags.push({
            type: 'unavailable',
            original: ingredient.name,
            message: rule.confirmation_message
          });
        }
        break;

      default:
        processedIngredients.push(ingredient);
    }
  }

  // Consolidate duplicates (e.g., if multiple sub-recipes need butter)
  const consolidated = consolidateIngredients(processedIngredients);

  return {
    processedIngredients: consolidated,
    flags
  };
}

/**
 * Consolidate duplicate ingredients by summing amounts
 * @param {array} ingredients 
 * @returns {array} - Consolidated ingredients
 */
function consolidateIngredients(ingredients) {
  const map = new Map();

  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;
    
    if (map.has(key)) {
      const existing = map.get(key);
      existing.amount = parseFloat((existing.amount + ing.amount).toFixed(3));
      // Preserve notes/flags
      if (ing.from_sub_recipe && !existing.from_sub_recipe) {
        existing.from_sub_recipe = ing.from_sub_recipe;
      }
      if (ing.note) {
        existing.note = existing.note ? `${existing.note}; ${ing.note}` : ing.note;
      }
    } else {
      map.set(key, { ...ing });
    }
  }

  return Array.from(map.values());
}

/**
 * Generate confirmation report for instructor
 * @param {array} flags - Flags from processIngredientRules
 * @returns {string} - Formatted report
 */
export function generateConfirmationReport(flags) {
  if (!flags || flags.length === 0) {
    return null;
  }

  const lines = ['## Ingredient Notes\n'];

  for (const flag of flags) {
    lines.push(`- ${flag.message}`);
    
    if (flag.type === 'make_in_house' && flag.ingredients) {
      lines.push(`  - Recipe: ${flag.recipe} (${flag.source})`);
      lines.push(`  - Ingredients added: ${flag.ingredients.join(', ')}`);
    }
  }

  return lines.join('\n');
}

export default {
  checkIngredientRule,
  getAllIngredientRules,
  expandSubRecipe,
  calculateFreshCitrus,
  processIngredientRules,
  generateConfirmationReport
};
