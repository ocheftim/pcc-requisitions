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

// REAL order data from Peddler's Son orders 7ZA2RS and VR572W
const orders = [
  {
    instructor: "Mikesell",
    course: "CUL168",
    week: "Week 6",
    day: "Monday",
    orderNumber: "VR572W",
    items: [
      { name: "Milk", qty: 2, unit: "case", peddlersCode: 'D431106', peddlersPrice: 12.50, packSize: '2/1GLN' },
      { name: "Corn", qty: 1, unit: "pack", peddlersCode: 'V200902', peddlersPrice: 2.70, packSize: '48 CT' },
      { name: "Active dry yeast", qty: 1, unit: "box", peddlersCode: 'G800304', peddlersPrice: 6.30, packSize: '20/1LB' },
      { name: "Balsamic vin", qty: 1, unit: "gallon", peddlersCode: 'G100053', peddlersPrice: 24.70, packSize: 'GALLON' },
      { name: "Butter", qty: 1, unit: "case", peddlersCode: 'D460212', peddlersPrice: 188.20, packSize: '36/1LB' },
      { name: "Cheddar", qty: 1, unit: "case", peddlersCode: 'D475105', peddlersPrice: 58.90, packSize: '2/5LB' },
      { name: "Eggs", qty: 1, unit: "case", peddlersCode: 'E402000', peddlersPrice: 50.00, packSize: '15 DZ' },
      { name: "Heavy Cream", qty: 1, unit: "case", peddlersCode: 'D432202', peddlersPrice: 106.50, packSize: '9/64 OZ' }
    ]
  },
  {
    instructor: "Wong",
    course: "CUL140",
    week: "Week 5",
    day: "Tuesday",
    orderNumber: "7ZA2RS",
    items: [
      { name: "Ylw Squash", qty: 1, unit: "case", peddlersCode: 'V210201', peddlersPrice: 10.20, packSize: '5 LBS' },
      { name: "Zucchini", qty: 1, unit: "case", peddlersCode: 'V210601', peddlersPrice: 7.10, packSize: '5 LBS' },
      { name: "Masa harina", qty: 1, unit: "bag", peddlersCode: 'G400006', peddlersPrice: 16.20, packSize: '25 LB' },
      { name: "Broccoli Crown", qty: 1, unit: "split", peddlersCode: 'V200600', peddlersPrice: 13.90, packSize: '20 LBS' },
      { name: "Raspberry", qty: 5, unit: "each", peddlersCode: 'F320400', peddlersPrice: 4.80, packSize: '12 CT CASE' },
      { name: "Red Potato", qty: 1, unit: "bag", peddlersCode: 'V142102', peddlersPrice: 7.10, packSize: '5 LB' },
      { name: "Shallots", qty: 1, unit: "case", peddlersCode: 'V131000', peddlersPrice: 16.30, packSize: '5 LBS' },
      { name: "Romaine", qty: 6, unit: "each", peddlersCode: 'V120300', peddlersPrice: 2.50, packSize: '24 CT' },
      { name: "Polenta", qty: 1, unit: "bag", peddlersCode: 'G810206', peddlersPrice: 46.40, packSize: '10 LB' },
      { name: "White Sugar", qty: 1, unit: "bag", peddlersCode: 'G100002', peddlersPrice: 22.20, packSize: '25 LB' }
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
  'ylw squash': 'PRODUCE',
  'zucchini': 'PRODUCE',
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
  'white sugar': 'BAKING',
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
      aggregatedItems[key] = { 
        name: normalizedName, 
        totalQty: 0, 
        unit: item.unit, 
        orders: [],
        peddlersCode: item.peddlersCode || '',
        peddlersPrice: item.peddlersPrice || 0,
        peddlersPackSize: item.packSize || ''
      };
    }
    aggregatedItems[key].totalQty += item.qty;
    aggregatedItems[key].orders.push({ 
      instructor: order.instructor, 
      course: order.course, 
      qty: item.qty,
      orderNumber: order.orderNumber || ''
    });
    
    // Use Peddler's data if available
    if (item.peddlersCode && !aggregatedItems[key].peddlersCode) {
      aggregatedItems[key].peddlersCode = item.peddlersCode;
      aggregatedItems[key].peddlersPrice = item.peddlersPrice;
      aggregatedItems[key].peddlersPackSize = item.packSize;
    }
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
    shamrockPrice: ingredient?.unitPrice || 0,
    peddlersCode: item.peddlersCode || ingredient?.peddlersCode || '',
    peddlersPrice: item.peddlersPrice || ingredient?.peddlersPrice || 0,
    peddlersPackSize: item.peddlersPackSize || ingredient?.peddlersPackSize || ''
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
  orders: orders.map(o => ({ 
    instructor: o.instructor, 
    course: o.course, 
    day: o.day,
    orderNumber: o.orderNumber || ''
  })),
  items: consolidatedItems,
  summary: {
    totalItems: consolidatedItems.length,
    itemsWithPricing: consolidatedItems.filter(i => i.peddlersPrice > 0 || i.shamrockPrice > 0).length,
    itemsWithoutPricing: consolidatedItems.filter(i => i.peddlersPrice === 0 && i.shamrockPrice === 0).length,
    peddlersItems: consolidatedItems.filter(i => i.peddlersPrice > 0).length
  }
};

fs.mkdirSync('./src/data/test', { recursive: true });
fs.writeFileSync('./src/data/test/consolidated-requisition-week6.json', JSON.stringify(consolidated, null, 2));

console.log('\n✅ CONSOLIDATED REQUISITION CREATED FROM REAL ORDERS!');
console.log('====================================');
console.log(`Total Orders: ${consolidated.totalOrders}`);
console.log(`Total Items: ${consolidated.items.length}`);
console.log(`Items with Peddler's pricing: ${consolidated.summary.peddlersItems}`);
console.log(`Items with any pricing: ${consolidated.summary.itemsWithPricing}`);
console.log(`Items without pricing: ${consolidated.summary.itemsWithoutPricing}`);
console.log('\nOrders in weekday order:');
consolidated.orders.forEach(o => {
  console.log(`  ${o.day}: ${o.instructor} - ${o.course} ${o.orderNumber ? `(Order ${o.orderNumber})` : ''}`);
});
console.log('\nCategories:');
const categoryCounts = consolidatedItems.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} items`);
});
console.log('\nReal Peddler\'s Orders:');
console.log('  Order 7ZA2RS: Wong CUL140 (10 items)');
console.log('  Order VR572W: Mikesell CUL168 (8 items)');
