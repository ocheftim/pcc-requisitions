import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const RULE_TYPES = [
  { value: 'substitute', label: 'Substitute', description: 'Replace with different ingredient' },
  { value: 'make_in_house', label: 'Make In-House', description: 'Expand to sub-recipe ingredients' },
  { value: 'use_fresh', label: 'Use Fresh', description: 'Convert to fresh ingredient (citrus)' },
  { value: 'unavailable', label: 'Unavailable', description: 'Item cannot be ordered' }
];

export default function IngredientRulesPage() {
  const [rules, setRules] = useState([]);
  const [subRecipes, setSubRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    requested_item: '',
    rule_type: 'substitute',
    substitute_item: '',
    recipe_name: '',
    recipe_source: '',
    confirmation_message: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load rules
    const { data: rulesData } = await supabase
      .from('ingredient_rules')
      .select('*')
      .order('requested_item');
    
    setRules(rulesData || []);
    
    // Load sub-recipes for dropdown
    const { data: recipesData } = await supabase
      .from('sub_recipes')
      .select('id, name, source')
      .order('name');
    
    setSubRecipes(recipesData || []);
    
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Auto-generate confirmation message if empty
    let message = formData.confirmation_message;
    if (!message) {
      if (formData.rule_type === 'substitute') {
        message = `${formData.requested_item} — substituted with ${formData.substitute_item}`;
      } else if (formData.rule_type === 'make_in_house') {
        message = `${formData.requested_item} — made in-house per ${formData.recipe_source || formData.recipe_name}`;
      } else if (formData.rule_type === 'use_fresh') {
        message = `${formData.requested_item} — use fresh`;
      } else if (formData.rule_type === 'unavailable') {
        message = `${formData.requested_item} — not available`;
      }
    }
    
    const ruleData = { ...formData, confirmation_message: message };
    
    if (editingRule) {
      await supabase
        .from('ingredient_rules')
        .update(ruleData)
        .eq('id', editingRule.id);
    } else {
      await supabase
        .from('ingredient_rules')
        .insert(ruleData);
    }
    
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      requested_item: '',
      rule_type: 'substitute',
      substitute_item: '',
      recipe_name: '',
      recipe_source: '',
      confirmation_message: '',
      is_active: true
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const editRule = (rule) => {
    setFormData({
      requested_item: rule.requested_item || '',
      rule_type: rule.rule_type || 'substitute',
      substitute_item: rule.substitute_item || '',
      recipe_name: rule.recipe_name || '',
      recipe_source: rule.recipe_source || '',
      confirmation_message: rule.confirmation_message || '',
      is_active: rule.is_active !== false
    });
    setEditingRule(rule);
    setShowForm(true);
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    await supabase.from('ingredient_rules').delete().eq('id', id);
    loadData();
  };

  const toggleActive = async (rule) => {
    await supabase
      .from('ingredient_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);
    loadData();
  };

  const getRuleTypeInfo = (type) => RULE_TYPES.find(t => t.value === type) || RULE_TYPES[0];

  if (loading) {
    return <div className="p-6"><div className="text-center py-12">Loading...</div></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Ingredient Rules</h1>
            <p className="text-gray-500">Manage automatic substitutions and make-in-house items</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {RULE_TYPES.map(type => {
            const count = rules.filter(r => r.rule_type === type.value && r.is_active).length;
            return (
              <div key={type.value} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600">{type.label}</div>
              </div>
            );
          })}
        </div>

        {/* Rules List */}
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rules configured. Click "Add Rule" to create one.
            </div>
          ) : (
            rules.map(rule => {
              const typeInfo = getRuleTypeInfo(rule.rule_type);
              return (
                <div
                  key={rule.id}
                  className={`border rounded-lg p-4 flex items-center gap-4 ${
                    rule.is_active ? 'bg-white' : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div className={`text-sm font-bold px-2 py-1 rounded ${
                    rule.rule_type === 'substitute' ? 'bg-blue-100 text-blue-700' :
                    rule.rule_type === 'make_in_house' ? 'bg-orange-100 text-orange-700' :
                    rule.rule_type === 'use_fresh' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>{typeInfo.label}</div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-lg">{rule.requested_item}</div>
                    <div className="text-sm text-gray-600">
                      {rule.rule_type === 'substitute' && (
                        <>→ {rule.substitute_item}</>
                      )}
                      {rule.rule_type === 'make_in_house' && (
                        <>Recipe: {rule.recipe_name} ({rule.recipe_source})</>
                      )}
                      {rule.rule_type === 'use_fresh' && (
                        <>Convert to fresh</>
                      )}
                      {rule.rule_type === 'unavailable' && (
                        <>Cannot be ordered</>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`px-3 py-1 rounded text-sm ${
                        rule.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => editRule(rule)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-bold mb-4">
                {editingRule ? 'Edit Rule' : 'Add Rule'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Requested Item (what instructor asks for)
                  </label>
                  <input
                    type="text"
                    value={formData.requested_item}
                    onChange={e => setFormData({...formData, requested_item: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., Candied Orange Peel"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rule Type</label>
                  <select
                    value={formData.rule_type}
                    onChange={e => setFormData({...formData, rule_type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {RULE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.rule_type === 'substitute' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Substitute With
                    </label>
                    <input
                      type="text"
                      value={formData.substitute_item}
                      onChange={e => setFormData({...formData, substitute_item: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., Ground Nutmeg"
                    />
                  </div>
                )}

                {formData.rule_type === 'make_in_house' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Sub-Recipe Name
                      </label>
                      <select
                        value={formData.recipe_name}
                        onChange={e => {
                          const recipe = subRecipes.find(r => r.name === e.target.value);
                          setFormData({
                            ...formData, 
                            recipe_name: e.target.value,
                            recipe_source: recipe?.source || ''
                          });
                        }}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">Select a sub-recipe...</option>
                        {subRecipes.map(recipe => (
                          <option key={recipe.id} value={recipe.name}>
                            {recipe.name} ({recipe.source})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Or type custom name below
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Recipe Name (custom)
                      </label>
                      <input
                        type="text"
                        value={formData.recipe_name}
                        onChange={e => setFormData({...formData, recipe_name: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g., Candied Citrus Peel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Recipe Source
                      </label>
                      <input
                        type="text"
                        value={formData.recipe_source}
                        onChange={e => setFormData({...formData, recipe_source: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g., OnBaking p.737"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirmation Message (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.confirmation_message}
                    onChange={e => setFormData({...formData, confirmation_message: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Auto-generated if blank"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm">Active</label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingRule ? 'Update Rule' : 'Add Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
