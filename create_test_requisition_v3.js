import { ingredientsList } from './src/data/ingredients/ingredientsList.js';
import fs from 'fs';

function findIngredient(name) {
  const searchName = name.toLowerCase().trim();
  
  // Special case: AP Flour and All-purpose flour are the same
  if (searchName.includes('ap flour') || searchName.includes('all-purpose flour') || searchName.includes('all purpose flour')) {
    return ingredientsList.find(ing => ing.name.toLowerCase().includes('ap flour') || ing.name.toLowerCase().includes('all-purpose'));
  }
  
  return ingredientsList.find(ing => 
    ing.name.toLowerCase() === searchName ||
    ing.name.toLowerCase().includes(searchName) ||
    searchName.includes(ing.name.toLowerCase())
  );
}

// Weekday order for sorting
const weekdayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };

const orders = [
  {
    instructor: "Elizabeth Mikesell",
    course: "CUL168",
    week: "Week 6",
    day: "Monday",
    items: [
      { name: "All-purpose flour", qty: 3, unit: "lb" },
      { name: "Bread flour", qty: 26, unit: "lb" },
      { name: "Whole wheat flour", qty: 10, unit: "lb" },
      { name: "Baking powder", qty: 2, unit: "tsp" },
      { name: "Lard", qty: 8, unit: "oz" },
      { name: "Salt", qty: 5, unit: "oz" },
      { name: "Masa harina", qty: 4, unit: "lb" },
      { name: "Fine sea salt", qty: 2, unit: "oz" },
      { name: "Active dry yeast", qty: 5, unit: "oz" },
      { name: "Butter", qty: 1, unit: "lb" },
      { name: "Molasses", qty: 1, unit: "pint" },
      { name: "Sunflower kernels", qty: 2, unit: "lb" },
      { name: "Polenta", qty: 3, unit: "lb" },
      { name: "Yellow cornmeal", qty: 3, unit: "lb" },
      { name: "Mesquite flour", qty: 2, unit: "lb" },
      { name: "Sourdough culture", qty: 3, unit: "lb" },
      { name: "Eggs", qty: 1, unit: "dozen" }
    ]
  },
  {
    instructor: "Wong",
    course: "CUL140",
    week: "Week 5",
    day: "Tuesday",
    items: [
      { name: "Ylw Onion", qty: 16, unit: "lb" },
      { name: "Red Potato", qty: 12, unit: "lb" },
      { name: "Garlic Bulb", qty: 2, unit: "ea" },
      { name: "Shallots", qty: 11, unit: "ea" },
      { name: "Carrots", qty: 4, unit: "lb" },
      { name: "Celery", qty: 2, unit: "bnch" },
      { name: "Red Bell", qty: 4, unit: "ea" },
      { name: "Cherry Tomato", qty: 1, unit: "pt" },
      { name: "Aspargus", qty: 2, unit: "lb" },
      { name: "Corn", qty: 2, unit: "ea" },
      { name: "Romaine", qty: 6, unit: "ea" },
      { name: "Grn onion", qty: 2, unit: "bnch" },
      { name: "Ylw Squash", qty: 4, unit: "ea" },
      { name: "Zucchini", qty: 4, unit: "ea" },
      { name: "Butter", qty: 4, unit: "lb" },
      { name: "Cheddar", qty: 3, unit: "lb" },
      { name: "Mozz", qty: 3, unit: "lb" },
      { name: "Honey", qty: 10, unit: "oz" },
      { name: "Broccoli Crown", qty: 2, unit: "" },
      { name: "Dry Mustard pwd", qty: 4, unit: "oz" },
      { name: "Elbow Noodle", qty: 2, unit: "#" },
      { name: "Bacon", qty: 2, unit: "#" },
      { name: "Chicken Brst Hvst", qty: 8, unit: "#" },
      { name: "chicken stock", qty: 8, unit: "qt" },
      { name: "EVO", qty: 1, unit: "qt" },
      { name: "Canola Oil", qty: 1, unit: "qt" },
      { name: "Balsamic vin", qty: 1, unit: "qt" },
      { name: "Apple Cider Vin", qty: 1, unit: "qt" }
    ]
  },
  {
    instructor: "McKoy",
    course: "CUL260",
    week: "Week 6",
    day: "Tuesday",
    items: [
      { name: "Raspberry", qty: 5, unit: "pt" },
      { name: "Raisin", qty: 5, unit: "lb" },
      { name: "Eggs", qty: 6, unit: "doz" },
      { name: "Milk", qty: 4, unit: "gallon" },
      { name: "Heavy Cream", qty: 16, unit: "qt" },
      { name: "Gelatin Sheets", qty: 10, unit: "ea" },
      { name: "Cake flour", qty: 6, unit: "lb" },
      { name: "White Sugar", qty: 6, unit: "lb" },
      { name: "Powder sugar", qty: 5, unit: "lb" }
    ]
  },
  {
    instructor: "McKoy",
    course: "CUL160",
    week: "Week 6",
    day: "Wednesday",
    items: [
      { name: "Walnut Pieces", qty: 5, unit: "lb" },
      { name: "Dk Chocolate Callets", qty: 3, unit: "lb" },
      { name: "Wh. Chocolate Callets", qty: 3, unit: "lb" },
      { name: "Eggs", qty: 8, unit: "doz" },
      { name: "Heavy Cream", qty: 2, unit: "qt" },
      { name: "Butter", qty: 6, unit: "lb" },
      { name: "Dark Corn Syrup", qty: 12, unit: "oz" },
      { name: "AP Flour", qty: 38, unit: "lb" },
      { name: "White Sugar", qty: 6, unit: "lb" },
      { name: "Brown Sugar", qty: 4, unit: "lb" },
      { name: "Powder sugar", qty: 45, unit: "lb" }
    ]
  }
];

// Sort orders by weekday
orders.sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day]);

// Manual category mapping for items not in database
const categoryMapping = {
  'corn': 'PRODUCE',
  'ylw onion': 'PRODUCE',
  'red potato': 'PRODUCE',
  'garlic bulb': 'PRODUCE',
  'shallots': 'PRODUCE',
  'carrots': 'PRODUCE',
  'celery': 'PRODUCE',
  'red bell': 'PRODUCE',
  'cherry tomato': 'PRODUCE',
  'aspargus': 'PRODUCE',
  'romaine': 'PRODUCE',
  'grn onion': 'PRODUCE',
  'ylw squash': 'PRODUCE',
  'zucchini': 'PRODUCE',
  'broccoli crown': 'PRODUCE',
  'bacon': 'PROTEIN',
  'chicken brst hvst': 'PROTEIN',
  'chicken stock': 'PANTRY',
  'elbow noodle': 'PANTRY',
  'evo': 'PANTRY',
  'canola oil': 'PANTRY',
  'balsamic vin': 'PANTRY',
  'apple cider vin': 'PANTRY',
  'dry mustard pwd': 'PANTRY',
  'bread flour': 'BAKING',
  'whole wheat flour': 'BAKING',
  'baking powder': 'BAKING',
  'lard': 'BAKING',
  'salt': 'BAKING',
  'masa harina': 'BAKING',
  'fine sea salt': 'BAKING',
  'active dry yeast': 'BAKING',
  'molasses': 'BAKING',
  'sunflower kernels': 'BAKING',
  'polenta': 'BAKING',
  'yellow cornmeal': 'BAKING',
  'mesquite flour': 'BAKING',
  'sourdough culture': 'BAKING',
  'cheddar': 'DAIRY',
  'mozz': 'DAIRY',
  'mozzarella': 'DAIRY'
};

const aggregatedItems = {};
orders.forEach(order => {
  order.items.forEach(item => {
    // Normalize name for AP Flour
    let normalizedName = item.name;
    const lowerName = item.name.toLowerCase();
    if (lowerName.includes('all-purpose') || lowerName.includes('all purpose')) {
      normalizedName = 'AP Flour';
    }
    
    const key = normalizedName.toLowerCase().trim();
    if (!aggregatedItems[key]) {
      aggregatedItems[key] = { name: normalizedName, totalQty: 0, unit: item.unit, orders: [] };
    }
    aggregatedItems[key].totalQty += item.qty;
    aggregatedItems[key].orders.push({ instructor: order.instructor, course: order.course, qty: item.qty });
  });
});

const consolidatedItems = Object.values(aggregatedItems).map(item => {
  const ingredient = findIngredient(item.name);
  
  // Determine category
  let category = ingredient?.category || 'Unknown';
  if (category === 'Unknown') {
    const mappedCategory = categoryMapping[item.name.toLowerCase().trim()];
    if (mappedCategory) {
      category = mappedCategory;
    }
  }
  
  return {
    ingredientId: ingredient?.id || null,
    ingredientName: item.name,
    category: category,
    requestedQty: item.totalQty,
    unit: item.unit,
    orders: item.orders,
    shamrockCode: ingredient?.shamrockCode || '',
    unitPrice: ingredient?.unitPrice || 0
  };
});

consolidatedItems.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.ingredientName.localeCompare(b.ingredientName);
});

const consolidated = {
  weekNumber: 6,
  semester: "Fall 2025",
  dateCreated: new Date().toISOString(),
  totalOrders: orders.length,
  orders: orders.map(o => ({ instructor: o.instructor, course: o.course, day: o.day })),
  items: consolidatedItems,
  summary: {
    totalItems: consolidatedItems.length,
    itemsWithPricing: consolidatedItems.filter(i => i.unitPrice > 0).length,
    itemsWithoutPricing: consolidatedItems.filter(i => i.unitPrice === 0).length
  }
};

fs.mkdirSync('./src/data/test', { recursive: true });
fs.writeFileSync('./src/data/test/consolidated-requisition-week6.json', JSON.stringify(consolidated, null, 2));

console.log('\n✅ CONSOLIDATED REQUISITION CREATED!');
console.log('====================================');
console.log(`Total Orders: ${consolidated.totalOrders}`);
console.log(`Total Items: ${consolidated.items.length}`);
console.log(`With Pricing: ${consolidated.summary.itemsWithPricing}`);
console.log(`Without Pricing: ${consolidated.summary.itemsWithoutPricing}`);
console.log('\nOrders in weekday order:');
consolidated.orders.forEach(o => {
  console.log(`  ${o.day}: ${o.instructor} - ${o.course}`);
});
console.log('\nCategories:');
const categoryCounts = consolidatedItems.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} items`);
});
