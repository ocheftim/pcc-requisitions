/**
 * useIngredientRules Hook
 * Provides ingredient rule checking and processing for requisition forms
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useIngredientRules() {
  const [rules, setRules] = useState([]);
  const [subRecipes, setSubRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all rules on mount
  useEffect(() => {
    async function loadRules() {
      const { data: rulesData } = await supabase
        .from('ingredient_rules')
        .select('*')
        .eq('is_active', true);

      const { data: recipesData } = await supabase
        .from('sub_recipes')
        .select(`
          id, name, source, yield_amount, yield_unit,
          sub_recipe_ingredients (
            ingredient_name, amount, unit, sort_order
          )
        `);

      setRules(rulesData || []);
      setSubRecipes(recipesData || []);
      setLoading(false);
    }

    loadRules();
  }, []);

  /**
   * Check if an ingredient name matches any rule
   */
  const findRule = useCallback((ingredientName) => {
    if (!ingredientName) return null;
    
    const name = ingredientName.toLowerCase().trim();
    
    return rules.find(r => 
      r.requested_item.toLowerCase() === name ||
      name.includes(r.requested_item.toLowerCase())
    );
  }, [rules]);

  /**
   * Get expanded ingredients for a sub-recipe
   */
  const getSubRecipeIngredients = useCallback((recipeName, scale = 1) => {
    const recipe = subRecipes.find(r => 
      r.name.toLowerCase() === recipeName.toLowerCase()
    );

    if (!recipe || !recipe.sub_recipe_ingredients) {
      return [];
    }

    return recipe.sub_recipe_ingredients
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(ing => ({
        name: ing.ingredient_name,
        amount: parseFloat((ing.amount * scale).toFixed(3)),
        unit: ing.unit,
        fromRecipe: recipe.name,
        source: recipe.source
      }));
  }, [subRecipes]);

  /**
   * Process a single ingredient through rules
   * Returns { processed: [], flags: [] }
   */
  const processIngredient = useCallback((ingredient) => {
    const rule = findRule(ingredient.name);
    
    if (!rule) {
      return { 
        processed: [ingredient], 
        flags: [] 
      };
    }

    const processed = [];
    const flags = [];

    switch (rule.rule_type) {
      case 'substitute':
        processed.push({
          ...ingredient,
          name: rule.substitute_item,
          originalName: ingredient.name
        });
        flags.push({
          type: 'substitute',
          original: ingredient.name,
          replacement: rule.substitute_item,
          message: rule.confirmation_message
        });
        break;

      case 'use_fresh':
        const isCitrus = ingredient.name.toLowerCase();
        let fruit = 'Lemon';
        let fruitName = 'Lemons, Fresh';
        let yieldPerFruit = 1.0;

        if (isCitrus.includes('lime')) {
          fruit = 'Lime';
          fruitName = 'Limes, Fresh';
          yieldPerFruit = 0.75;
        } else if (isCitrus.includes('orange')) {
          fruit = 'Orange';
          fruitName = 'Oranges, Fresh';
          yieldPerFruit = 3.0;
        }

        const juiceOz = parseFloat(ingredient.amount) || 4;
        const count = Math.ceil(juiceOz / yieldPerFruit);

        processed.push({
          name: fruitName,
          amount: count,
          unit: 'ea',
          originalName: ingredient.name,
          note: `For ${juiceOz} oz juice`
        });
        flags.push({
          type: 'use_fresh',
          original: ingredient.name,
          replacement: `${count} ${fruitName}`,
          message: rule.confirmation_message
        });
        break;

      case 'make_in_house':
        if (rule.recipe_name) {
          const subIngredients = getSubRecipeIngredients(rule.recipe_name);
          
          subIngredients.forEach(sub => {
            processed.push({
              name: sub.name,
              amount: sub.amount,
              unit: sub.unit,
              fromRecipe: sub.fromRecipe
            });
          });

          flags.push({
            type: 'make_in_house',
            original: ingredient.name,
            recipe: rule.recipe_name,
            source: rule.recipe_source,
            ingredients: subIngredients,
            message: rule.confirmation_message
          });
        }
        break;

      case 'unavailable':
        flags.push({
          type: 'unavailable',
          original: ingredient.name,
          message: rule.confirmation_message
        });
        break;

      default:
        processed.push(ingredient);
    }

    return { processed, flags };
  }, [findRule, getSubRecipeIngredients]);

  /**
   * Process an entire requisition's ingredients
   */
  const processRequisition = useCallback((ingredients) => {
    const allProcessed = [];
    const allFlags = [];

    for (const ing of ingredients) {
      const { processed, flags } = processIngredient(ing);
      allProcessed.push(...processed);
      allFlags.push(...flags);
    }

    // Consolidate duplicates
    const consolidated = new Map();
    for (const ing of allProcessed) {
      const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;
      if (consolidated.has(key)) {
        const existing = consolidated.get(key);
        existing.amount = parseFloat((existing.amount + ing.amount).toFixed(3));
      } else {
        consolidated.set(key, { ...ing });
      }
    }

    return {
      ingredients: Array.from(consolidated.values()),
      flags: allFlags
    };
  }, [processIngredient]);

  return {
    rules,
    subRecipes,
    loading,
    findRule,
    getSubRecipeIngredients,
    processIngredient,
    processRequisition
  };
}

export default useIngredientRules;
