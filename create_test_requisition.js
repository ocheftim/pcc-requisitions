const fs = require('fs');

const ingredientsData = JSON.parse(fs.readFileSync('./src/data/ingredientsData.json', 'utf-8'));

function findIngredient(name) {
  const searchName = name.toLowerCase().trim();
  return ingredientsData.find(ing => 
    ing.name.toLowerCase() === searchName ||
    ing.name.toLowerCase().includes(searchName) ||
    searchName.includes(ing.name.toLowerCase())
  );
}

const orders = [
  {
    instructor: "McKoy", course: "CUL160", week: "Week 6", day: "Wednesday",
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
  },
  {
    instructor: "McKoy", course: "CUL260", week: "Week 6", day: "Tuesday",
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
    instructor: "Wong", course: "CUL140", week: "Week 5", day: "Tuesday",
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
    instructor: "Staff", course: "CUL168", week: "Week 6", day: "Monday",
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
      { name: "Sourdough culture (active)", qty: 3, unit: "lb" },
      { name: "Eggs", qty: 1, unit: "dozen" }
    ]
  }
];

const aggregatedItems = {};
orders.forEach(order => {
  order.items.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (!aggregatedItems[key]) {
      aggregatedItems[key] = { name: item.name, totalQty: 0, unit: item.unit, orders: [] };
    }
    aggregatedItems[key].totalQty += item.qty;
    aggregatedItems[key].orders.push({ instructor: order.instructor, course: order.course, qty: item.qty });
  });
});

const consolidatedItems = Object.values(aggregatedItems).map(item => {
  const ingredient = findIngredient(item.name);
  return {
    ingredientName: item.name,
    category: ingredient?.category || 'Unknown',
    requestedQty: item.totalQty,
    unit: item.unit,
    orders: item.orders,
    syscoCode: ingredient?.syscoCode || '',
    syscoPrice: ingredient?.syscoPrice || 0,
    syscoPackSize: ingredient?.syscoPackSize || ''
  };
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
    itemsWithPricing: consolidatedItems.filter(i => i.syscoPrice > 0).length
  }
};

fs.writeFileSync('./test-data/consolidated-requisition-week6.json', JSON.stringify(consolidated, null, 2));
console.log('✅ Created:', consolidatedItems.length, 'items');
