import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xoswclwjsmwpemcrvorp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc3djbHdqc213cGVtY3J2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTQ1NzQsImV4cCI6MjA3OTk5MDU3NH0.JexQn0yFDURVI-g5ILj9Dfj7LHAQyV34clLDA2Uw1eE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Requisition functions
export const saveRequisition = async (requisition) => {
  const { data, error } = await supabase
    .from('requisitions')
    .insert([requisition])
    .select();
  if (error) throw error;
  return data[0];
};

export const getRequisitions = async () => {
  const { data, error } = await supabase
    .from('requisitions')
    .select('*');
  if (error) throw error;
  
  // Sort by week number, then by class_date
  return data.sort((a, b) => {
    const weekA = parseInt(a.week?.match(/Week (\d+)/)?.[1] || 0);
    const weekB = parseInt(b.week?.match(/Week (\d+)/)?.[1] || 0);
    if (weekA !== weekB) return weekA - weekB;
    return new Date(a.class_date) - new Date(b.class_date);
  });
};

export const updateRequisition = async (id, updates) => {
  const { data, error } = await supabase
    .from('requisitions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteRequisition = async (id) => {
  const { error } = await supabase
    .from('requisitions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Settings functions
export const getSetting = async (key) => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value || null;
};

export const saveSetting = async (key, value) => {
  const { data, error } = await supabase
    .from('settings')
    .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' })
    .select();
  if (error) throw error;
  return data[0];
};

// Ingredient customization functions (uses JSONB customizations column)
export const getIngredientCustomizations = async () => {
  const { data, error } = await supabase
    .from('ingredient_customizations')
    .select('*');
  if (error) throw error;
  return data || [];
};

export const saveIngredientCustomization = async (ingredientId, updates, isCustom = false) => {
  const { data: existing } = await supabase
    .from('ingredient_customizations')
    .select('customizations')
    .eq('ingredient_id', ingredientId)
    .single();
  
  const currentCustomizations = existing?.customizations || {};
  const mergedCustomizations = { ...currentCustomizations, ...updates, updated_at: new Date().toISOString() };
  
  const { data, error } = await supabase
    .from('ingredient_customizations')
    .upsert([{ 
      ingredient_id: ingredientId, 
      is_custom: isCustom,
      customizations: mergedCustomizations,
      updated_at: new Date().toISOString()
    }], { onConflict: 'ingredient_id' })
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteIngredientDB = async (ingredientId) => {
  return saveIngredientCustomization(ingredientId, { deleted: true });
};

export const restoreIngredientDB = async (ingredientId) => {
  return saveIngredientCustomization(ingredientId, { deleted: false });
};

export const setInstructorVisibility = async (ingredientId, hidden) => {
  const { data, error } = await supabase
    .from('ingredients')
    .update({ hidden_from_instructor: hidden })
    .eq('id', ingredientId)
    .select();
  if (error) throw error;
  return data[0];
};

export const bulkSetInstructorVisibility = async (ingredientIds, hidden) => {
  const promises = ingredientIds.map(id => setInstructorVisibility(id, hidden));
  return Promise.all(promises);
};

// Fetch all ingredients from Supabase
export async function getIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }
  
  // Map snake_case to camelCase for app compatibility
  return data.map(ing => ({
    id: ing.id,
    name: ing.name,
    category: ing.category,
    subcategory: ing.subcategory,
    unit: ing.unit,
    vendor: ing.vendor,
    vendorCode: ing.vendor_code,
    syscoCode: ing.vendor_code,
    packSize: ing.pack_size,
    syscoPackSize: ing.pack_size,
    unitPrice: parseFloat(ing.unit_price) || 0,
    casePrice: parseFloat(ing.case_price) || 0,
    syscoPrice: parseFloat(ing.case_price) || 0,
    brand: ing.brand,
    programs: ing.programs,
    storage: ing.storage,
    hiddenFromInstructor: ing.hidden_from_instructor
  }));
}

// Save/update ingredient in Supabase
export async function saveIngredient(ingredient) {
  const { data, error } = await supabase
    .from('ingredients')
    .upsert({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      subcategory: ingredient.subcategory,
      unit: ingredient.unit,
      vendor: ingredient.vendor,
      vendor_code: ingredient.vendorCode || ingredient.syscoCode,
      pack_size: ingredient.packSize || ingredient.syscoPackSize,
      case_price: ingredient.casePrice || ingredient.syscoPrice || 0,
      brand: ingredient.brand,
      programs: ingredient.programs,
      storage: ingredient.storage,
      hidden_from_instructor: ingredient.hiddenFromInstructor || false,
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .select();
  
  if (error) {
    console.error('Error saving ingredient:', error);
    return null;
  }
  return data[0];
}

// Delete ingredient (soft delete)
export async function deleteIngredient(id) {
  const { error } = await supabase
    .from('ingredients')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting ingredient:', error);
    return false;
  }
  return true;
}

// Instructor Authentication
export const loginInstructor = async (name, password) => {
  const { data, error } = await supabase
    .from('instructor_users')
    .select('*')
    .ilike('name', `%${name}%`)
    .single();
  
  if (error || !data) return { error: 'Instructor not found' };
  
  // Check password or master override
  const { data: masterPw } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'master_password')
    .single();
  
  if (data.password_hash !== password && masterPw?.value !== password) {
    return { error: 'Invalid password' };
  }
  
  // Update login stats
  const today = new Date().toISOString().split('T')[0];
  const lastLogin = data.last_login;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let newStreak = data.login_streak || 0;
  let pointsEarned = 0;
  
  if (lastLogin !== today) {
    pointsEarned = 10;
    if (lastLogin === yesterday) {
      newStreak += 1;
      pointsEarned += newStreak * 5;
    } else {
      newStreak = 1;
    }
    
    await supabase
      .from('instructor_users')
      .update({
        last_login: today,
        last_login_time: new Date().toISOString(),
        login_streak: newStreak,
        login_points: (data.login_points || 0) + pointsEarned
      })
      .eq('id', data.id);
  }
  
  return { 
    instructor: { ...data, login_points: (data.login_points || 0) + pointsEarned, login_streak: newStreak },
    pointsEarned,
    mustChangePassword: data.must_change_password
  };
};

export const changeInstructorPassword = async (id, newPassword) => {
  const { error } = await supabase
    .from('instructor_users')
    .update({ password_hash: newPassword, must_change_password: false })
    .eq('id', id);
  return { error };
};

export const getInstructorRequisitions = async (instructorName) => {
  const { data } = await supabase
    .from('requisitions')
    .select('*')
    .ilike('instructor', `%${instructorName.replace('Chef ', '')}%`)
    .order('class_date', { ascending: true });
  return data || [];
};

export const getInstructorUsers = async () => {
  const { data } = await supabase.from('instructor_users').select('*').order('name');
  return data || [];
};

export const updateInstructorUser = async (id, updates) => {
  const { error } = await supabase.from('instructor_users').update(updates).eq('id', id);
  return { error };
};

export const resetInstructorPassword = async (id, lastName) => {
  const newPassword = lastName.toLowerCase() + '2026';
  const { error } = await supabase
    .from('instructor_users')
    .update({ password_hash: newPassword, must_change_password: true })
    .eq('id', id);
  return { error };
};
