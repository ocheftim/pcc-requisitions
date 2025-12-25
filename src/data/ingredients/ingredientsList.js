import { shamrockIngredientsList } from './shamrockIngredients';
import { syscoOrderGuide, getSyscoBySUPC, getSyscoByCategory } from './syscoOrderGuide';

// Baking Ingredients - Updated with real Sysco data
export const bakingIngredientsList = [
  // Flours - Real Sysco data
  { id: 'B001', name: 'Flour, All Purpose', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '8379251', syscoPackSize: '1/25LB', syscoPrice: 10.95 },
  { id: 'B002', name: 'Flour, Cake', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '4014494', syscoPackSize: '1/50LB', syscoPrice: 27.95 },
  { id: 'B003', name: 'Flour, Bread', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '5035217', syscoPackSize: '1/50LB', syscoPrice: 18.95 },
  { id: 'B004', name: 'Flour, Pastry', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '4567186', syscoPackSize: '1/50LB', syscoPrice: 28.79 },
  { id: 'B005', name: 'Flour, Whole Wheat', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '4014684', syscoPackSize: '1/50LB', syscoPrice: 18.75 },
  { id: 'B006', name: 'Flour, Rye', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '5765724', syscoPackSize: '1/50LB', syscoPrice: 47.50 },
  { id: 'B007', name: 'Flour, Semolina', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '5765732', syscoPackSize: '1/50LB', syscoPrice: 55.00 },
  { id: 'B008', name: 'Cornmeal', category: 'Pantry', subcategory: 'Grains', unit: 'lb', syscoCode: '5765740', syscoPackSize: '1/50LB', syscoPrice: 32.50 },
  { id: 'B009', name: 'Polenta', category: 'Pantry', subcategory: 'Grains', unit: 'lb', syscoCode: '4147923', syscoPackSize: '6/5LB', syscoPrice: 42.90 },
  { id: 'B010', name: 'Flour, Masa Harina', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '5792163', syscoPackSize: '8/4.4LB', syscoPrice: 41.79 },
  { id: 'B011', name: 'Flour, Mesquite', category: 'Pantry', subcategory: 'Flours', unit: 'lb', syscoCode: '5765756', syscoPackSize: '1/5LB', syscoPrice: 42.50 },
  { id: 'B012', name: 'Oats, Rolled', category: 'Pantry', subcategory: 'Grains', unit: 'lb', syscoCode: '4082666', syscoPackSize: '1/25LB', syscoPrice: 26.50 },
  { id: 'B013', name: 'Quinoa', category: 'Pantry', subcategory: 'Grains', unit: 'lb', syscoCode: '2404410', syscoPackSize: '1/25LB', syscoPrice: 137.25 },

  // Sweeteners - Real Sysco data
  { id: 'B020', name: 'Sugar, Granulated', category: 'Pantry', subcategory: 'Sweeteners', unit: 'lb', syscoCode: '4082682', syscoPackSize: '1/50LB', syscoPrice: 39.00 },
  { id: 'B021', name: 'Sugar, Powdered', category: 'Pantry', subcategory: 'Sweeteners', unit: 'lb', syscoCode: '5593900', syscoPackSize: '12/2LB', syscoPrice: 37.59 },
  { id: 'B022', name: 'Sugar, Brown Light', category: 'Pantry', subcategory: 'Sweeteners', unit: 'lb', syscoCode: '4082690', syscoPackSize: '1/50LB', syscoPrice: 46.00 },
  { id: 'B023', name: 'Sugar, Brown Dark', category: 'Pantry', subcategory: 'Sweeteners', unit: 'lb', syscoCode: '4082698', syscoPackSize: '1/50LB', syscoPrice: 47.50 },
  { id: 'B024', name: 'Honey', category: 'Pantry', subcategory: 'Sweeteners', unit: 'oz', syscoCode: '5611652', syscoPackSize: '6/5LB', syscoPrice: 130.95 },
  { id: 'B025', name: 'Syrup, Maple', category: 'Pantry', subcategory: 'Sweeteners', unit: 'oz', syscoCode: '4082730', syscoPackSize: '4/1GAL', syscoPrice: 435.20 },
  { id: 'B026', name: 'Molasses', category: 'Pantry', subcategory: 'Sweeteners', unit: 'oz', syscoCode: '4082722', syscoPackSize: '4/1GAL', syscoPrice: 102.40 },
  { id: 'B027', name: 'Syrup, Corn Light', category: 'Pantry', subcategory: 'Sweeteners', unit: 'oz', syscoCode: '5296504', syscoPackSize: '4/1GAL', syscoPrice: 81.85 },
  { id: 'B028', name: 'Syrup, Corn Dark', category: 'Pantry', subcategory: 'Sweeteners', unit: 'oz', syscoCode: '4005294', syscoPackSize: '4/1GAL', syscoPrice: 78.45 },

  // Dairy - Real Sysco data
  { id: 'B031', name: 'Eggs, Large', category: 'Dairy & Eggs', subcategory: 'Eggs', unit: 'doz', syscoCode: '6200887', syscoPackSize: '1/15DOZ', syscoPrice: 43.99 },
  { id: 'B032', name: 'Milk, Whole', category: 'Dairy & Eggs', subcategory: 'Milk & Cream', unit: 'gal', syscoCode: '2327740', syscoPackSize: '4/1GAL', syscoPrice: 26.95 },
  { id: 'B033', name: 'Cream, Heavy', category: 'Dairy & Eggs', subcategory: 'Milk & Cream', unit: 'qt', syscoCode: '4828802', syscoPackSize: '12/32OZ', syscoPrice: 53.31 },
  { id: 'B034', name: 'Buttermilk', category: 'Dairy & Eggs', subcategory: 'Cultured Dairy', unit: 'qt', syscoCode: '2491702', syscoPackSize: '6/.5GAL', syscoPrice: 15.99 },
  { id: 'B035', name: 'Cream, Sour', category: 'Dairy & Eggs', subcategory: 'Cultured Dairy', unit: 'lb', syscoCode: '5020193', syscoPackSize: '2/5LB', syscoPrice: 19.79 },
  { id: 'B036', name: 'Cheese, Cream', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '1012566', syscoPackSize: '10/3LB', syscoPrice: 82.95 },
  { id: 'B037', name: 'Mascarpone', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '2389153', syscoPackSize: '12/16OZ', syscoPrice: 58.65 },
  { id: 'B038', name: 'Yogurt, Plain', category: 'Dairy & Eggs', subcategory: 'Cultured Dairy', unit: 'lb', syscoCode: '8133573', syscoPackSize: '1/32LB', syscoPrice: 57.95 },
  { id: 'B039', name: 'Half & Half', category: 'Dairy & Eggs', subcategory: 'Milk & Cream', unit: 'qt', syscoCode: '4828844', syscoPackSize: '12/1QT', syscoPrice: 17.16 },

  // Chocolate & Cocoa - Real Sysco data
  { id: 'B040', name: 'Chocolate, Chips', category: 'Pantry', subcategory: 'Chocolate & Cocoa', unit: 'lb', syscoCode: '5335732', syscoPackSize: '1/25LB', syscoPrice: 148.79 },
  { id: 'B041', name: 'Chocolate, Dark Callets', category: 'Pantry', subcategory: 'Chocolate & Cocoa', unit: 'lb', syscoCode: '5190505', syscoPackSize: '1/10KG', syscoPrice: 322.85 },
  { id: 'B042', name: 'Chocolate, Milk Callets', category: 'Pantry', subcategory: 'Chocolate & Cocoa', unit: 'lb', syscoCode: '7046854', syscoPackSize: '1/10KG', syscoPrice: 321.99 },
  { id: 'B043', name: 'Chocolate, White Callets', category: 'Pantry', subcategory: 'Chocolate & Cocoa', unit: 'lb', syscoCode: '7322530', syscoPackSize: '1/10KG', syscoPrice: 373.69 },
  { id: 'B044', name: 'Cocoa, Natural', category: 'Pantry', subcategory: 'Chocolate & Cocoa', unit: 'lb', syscoCode: '7286241', syscoPackSize: '1/2.2LB', syscoPrice: 38.59 },
  { id: 'B045', name: 'Cocoa, Dutch Process', category: 'Pantry', subcategory: 'Chocolate & Cocoa', unit: 'lb', syscoCode: '7286241', syscoPackSize: '1/2.2LB', syscoPrice: 38.59 },

  // Nuts & Seeds - Real Sysco data
  { id: 'B050', name: 'Almonds, Sliced', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '5963848', syscoPackSize: '3/2LB', syscoPrice: 79.95 },
  { id: 'B051', name: 'Almonds, Whole', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4645412', syscoPackSize: '3/2LB', syscoPrice: 67.79 },
  { id: 'B052', name: 'Pecans, Halves', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '7078389', syscoPackSize: '1/5LB', syscoPrice: 80.89 },
  { id: 'B053', name: 'Pecans, Pieces', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4645396', syscoPackSize: '3/2LB', syscoPrice: 90.89 },
  { id: 'B054', name: 'Walnuts, Halves', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4645388', syscoPackSize: '3/2LB', syscoPrice: 65.55 },
  { id: 'B055', name: 'Walnuts, Pieces', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4645388', syscoPackSize: '3/2LB', syscoPrice: 65.55 },
  { id: 'B056', name: 'Hazelnuts', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4082632', syscoPackSize: '1/25LB', syscoPrice: 300.00 },
  { id: 'B057', name: 'Pistachios', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '5529318', syscoPackSize: '1/5LB', syscoPrice: 82.95 },
  { id: 'B058', name: 'Cashews', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '7010545', syscoPackSize: '6/5LB', syscoPrice: 228.45 },
  { id: 'B059', name: 'Coconut, Shredded', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4504908', syscoPackSize: '1/10LB', syscoPrice: 53.85 },

  // Extracts & Flavorings - Real Sysco data
  { id: 'B060', name: 'Extract, Vanilla', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '5230057', syscoPackSize: '6/32OZ', syscoPrice: 69.59 },
  { id: 'B061', name: 'Vanilla Beans', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'ea', syscoCode: '9093196', syscoPackSize: '1/8OZ', syscoPrice: 59.95 },
  { id: 'B062', name: 'Extract, Almond', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '4082762', syscoPackSize: '1/32OZ', syscoPrice: 40.00 },
  { id: 'B063', name: 'Extract, Lemon', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '4082770', syscoPackSize: '1/32OZ', syscoPrice: 35.20 },

  // Leaveners & Thickeners - Real Sysco data
  { id: 'B070', name: 'Baking Powder', category: 'Pantry', subcategory: 'Leaveners', unit: 'lb', syscoCode: '4082856', syscoPackSize: '1/5LB', syscoPrice: 9.85 },
  { id: 'B071', name: 'Baking Soda', category: 'Pantry', subcategory: 'Leaveners', unit: 'lb', syscoCode: '4082864', syscoPackSize: '1/12LB', syscoPrice: 18.48 },
  { id: 'B072', name: 'Yeast, Active Dry', category: 'Pantry', subcategory: 'Leaveners', unit: 'lb', syscoCode: '4082831', syscoPackSize: '1/2LB', syscoPrice: 9.60 },
  { id: 'B073', name: 'Yeast, Instant', category: 'Pantry', subcategory: 'Leaveners', unit: 'lb', syscoCode: '4082839', syscoPackSize: '1/2LB', syscoPrice: 10.40 },
  { id: 'B074', name: 'Cream of Tartar', category: 'Pantry', subcategory: 'Baking Ingredients', unit: 'oz', syscoCode: '7577028', syscoPackSize: '1/28OZ', syscoPrice: 64.12 },
  { id: 'B075', name: 'Gelatin, Sheet', category: 'Pantry', subcategory: 'Thickeners', unit: 'ea', syscoCode: '8034894', syscoPackSize: '1/2.2LB', syscoPrice: 59.55 },
  { id: 'B076', name: 'Gelatin, Granules', category: 'Pantry', subcategory: 'Thickeners', unit: 'oz', syscoCode: '4157257', syscoPackSize: '12/1LB', syscoPrice: 263.95 },

  // Baking Ingredients
  { id: 'B080', name: 'Almond Paste', category: 'Pantry', subcategory: 'Baking Ingredients', unit: 'lb', syscoCode: '4082738', syscoPackSize: '1/7LB', syscoPrice: 66.50 },
  { id: 'B081', name: 'Marzipan', category: 'Pantry', subcategory: 'Baking Ingredients', unit: 'lb', syscoCode: '4082746', syscoPackSize: '1/7LB', syscoPrice: 57.75 },
  { id: 'B082', name: 'Sourdough Starter', category: 'Bakery & Bread', subcategory: 'Other', unit: 'oz', syscoCode: '0000001', syscoPackSize: '1/16OZ', syscoPrice: 40.00 },

  // Frozen Doughs - Real Sysco data
  { id: 'B090', name: 'Dough, Phyllo', category: 'Frozen Foods', subcategory: 'Frozen Breads', unit: 'lb', syscoCode: '9451600', syscoPackSize: '24/16OZ', syscoPrice: 130.99 },
  { id: 'B091', name: 'Dough, Puff Pastry', category: 'Frozen Foods', subcategory: 'Frozen Breads', unit: 'sheet', syscoCode: '7198009', syscoPackSize: '20/12OZ', syscoPrice: 62.99 },

  // Dried Fruits
  { id: 'B095', name: 'Raisins', category: 'Pantry', subcategory: 'Dried Fruits', unit: 'lb', syscoCode: '4082526', syscoPackSize: '1/30LB', syscoPrice: 84.00 },
  { id: 'B096', name: 'Cherries, Dried', category: 'Pantry', subcategory: 'Dried Fruits', unit: 'lb', syscoCode: '4082518', syscoPackSize: '1/5LB', syscoPrice: 60.00 },
  { id: 'B097', name: 'Apricots, Dried', category: 'Pantry', subcategory: 'Dried Fruits', unit: 'lb', syscoCode: '4082500', syscoPackSize: '1/5LB', syscoPrice: 32.50 },

  // Jams & Preserves
  { id: 'B098', name: 'Jam, Raspberry', category: 'Pantry', subcategory: 'Jams & Preserves', unit: 'lb', syscoCode: '4082950', syscoPackSize: '6/4LB', syscoPrice: 84.00 },
  { id: 'B099', name: 'Jam, Apricot', category: 'Pantry', subcategory: 'Jams & Preserves', unit: 'lb', syscoCode: '4082958', syscoPackSize: '6/4LB', syscoPrice: 78.00 },

  // Nut Butters & Condiments
  { id: 'B100', name: 'Peanut Butter', category: 'Pantry', subcategory: 'Nut Butters', unit: 'lb', syscoCode: '3318498', syscoPackSize: '12/18OZ', syscoPrice: 47.59 },
  { id: 'B101', name: 'Tahini', category: 'Pantry', subcategory: 'Condiments', unit: 'lb', syscoCode: '7190481', syscoPackSize: '6/2LB', syscoPrice: 100.44 },
  // Coffee & Tea
  { id: 'B102', name: 'Extract, Coffee', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/16OZ', syscoPrice: 28.00, needsPricing: true },
  { id: 'B103', name: 'Espresso Powder', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/16OZ', syscoPrice: 24.00, needsPricing: true },
  { id: 'B104', name: 'Tea, Earl Grey', category: 'Beverages', subcategory: 'Tea', unit: 'oz', syscoCode: '', syscoPackSize: '6/25CT', syscoPrice: 32.00, needsPricing: true },
  { id: 'B105', name: 'Tea, Green Matcha', category: 'Beverages', subcategory: 'Tea', unit: 'oz', syscoCode: '', syscoPackSize: '1/100G', syscoPrice: 45.00, needsPricing: true },
  { id: 'B106', name: 'Tea, Chamomile', category: 'Beverages', subcategory: 'Tea', unit: 'oz', syscoCode: '', syscoPackSize: '6/25CT', syscoPrice: 28.00, needsPricing: true },
  { id: 'B107', name: 'Coffee, Ground', category: 'Beverages', subcategory: 'Coffee', unit: 'lb', syscoCode: '', syscoPackSize: '6/2LB', syscoPrice: 68.00, needsPricing: true },
  { id: 'B108', name: 'Coffee, Whole Bean', category: 'Beverages', subcategory: 'Coffee', unit: 'lb', syscoCode: '', syscoPackSize: '6/2LB', syscoPrice: 72.00, needsPricing: true },

  // Additional Extracts
  { id: 'B109', name: 'Extract, Orange', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/16OZ', syscoPrice: 22.00, needsPricing: true },
  { id: 'B110', name: 'Extract, Peppermint', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/16OZ', syscoPrice: 18.00, needsPricing: true },
  { id: 'B111', name: 'Extract, Coconut', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/16OZ', syscoPrice: 16.00, needsPricing: true },
  { id: 'B112', name: 'Extract, Rum', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/16OZ', syscoPrice: 14.00, needsPricing: true },
  { id: 'B113', name: 'Rose Water', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '12/10OZ', syscoPrice: 38.00, needsPricing: true },
  { id: 'B114', name: 'Orange Blossom Water', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '12/10OZ', syscoPrice: 36.00, needsPricing: true },

  // Zests & Peels
  { id: 'B115', name: 'Lemon Zest, Dried', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/8OZ', syscoPrice: 12.00, needsPricing: true },
  { id: 'B116', name: 'Orange Zest, Dried', category: 'Pantry', subcategory: 'Extracts & Flavorings', unit: 'oz', syscoCode: '', syscoPackSize: '1/8OZ', syscoPrice: 12.00, needsPricing: true },
  { id: 'B117', name: 'Candied Orange Peel', category: 'Pantry', subcategory: 'Baking Ingredients', unit: 'lb', syscoCode: '', syscoPackSize: '1/5LB', syscoPrice: 42.00, needsPricing: true },
  { id: 'B118', name: 'Candied Lemon Peel', category: 'Pantry', subcategory: 'Baking Ingredients', unit: 'lb', syscoCode: '', syscoPackSize: '1/5LB', syscoPrice: 42.00, needsPricing: true },

  // Liqueurs for baking (cooking grade)
  { id: 'B120', name: 'Liqueur, Grand Marnier', category: 'Wine & Spirits', subcategory: 'Liqueurs', unit: 'oz', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 320.00, needsPricing: true },
  { id: 'B121', name: 'Liqueur, Kahlua', category: 'Wine & Spirits', subcategory: 'Liqueurs', unit: 'oz', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 280.00, needsPricing: true },
  { id: 'B122', name: 'Liqueur, Amaretto', category: 'Wine & Spirits', subcategory: 'Liqueurs', unit: 'oz', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 240.00, needsPricing: true },
  { id: 'B123', name: 'Liqueur, Frangelico', category: 'Wine & Spirits', subcategory: 'Liqueurs', unit: 'oz', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 260.00, needsPricing: true },
  { id: 'B124', name: 'Brandy, Cooking', category: 'Wine & Spirits', subcategory: 'Spirits', unit: 'oz', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 180.00, needsPricing: true },
  { id: 'B125', name: 'Rum, Dark', category: 'Wine & Spirits', subcategory: 'Spirits', unit: 'oz', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 160.00, needsPricing: true },

];

// Savory Ingredients - Updated with real Sysco data
export const savoryIngredientsList = [
  // Produce - Real Sysco data
  { id: 'S001', name: 'Orange, Fancy Fresh', category: 'Produce', subcategory: 'Fruit', unit: 'ea', syscoCode: '7651973', syscoPackSize: '1/138CT', syscoPrice: 31.29 },
  { id: 'S002', name: 'Lemon', category: 'Produce', subcategory: 'Fruit', unit: 'ea', syscoCode: '2538346', syscoPackSize: '1/140CT', syscoPrice: 32.59 },
  { id: 'S003', name: 'Lime', category: 'Produce', subcategory: 'Fruit', unit: 'ea', syscoCode: '1185040', syscoPackSize: '1/175CT', syscoPrice: 28.37 },
  { id: 'S004', name: 'Apple, Green', category: 'Produce', subcategory: 'Fruit', unit: 'ea', syscoCode: '5126867', syscoPackSize: '1/163CT', syscoPrice: 32.99 },
  { id: 'S005', name: 'Apple, Red', category: 'Produce', subcategory: 'Fruit', unit: 'lb', syscoCode: '4473056', syscoPackSize: '1/40LB', syscoPrice: 33.65 },
  { id: 'S006', name: 'Banana', category: 'Produce', subcategory: 'Fruit', unit: 'lb', syscoCode: '6894737', syscoPackSize: '1/5LB', syscoPrice: 8.95 },
  { id: 'S007', name: 'Strawberries', category: 'Produce', subcategory: 'Fruit', unit: 'pt', syscoCode: '1681958', syscoPackSize: '4/1LB', syscoPrice: 27.95 },
  { id: 'S008', name: 'Blueberries', category: 'Produce', subcategory: 'Fruit', unit: 'pt', syscoCode: '8864191', syscoPackSize: '6/.5PT', syscoPrice: 31.69 },
  { id: 'S009', name: 'Raspberries', category: 'Produce', subcategory: 'Fruit', unit: 'pt', syscoCode: '6196810', syscoPackSize: '6/.5PT', syscoPrice: 28.99 },
  { id: 'S010', name: 'Blackberries', category: 'Produce', subcategory: 'Fruit', unit: 'pt', syscoCode: '2017986', syscoPackSize: '6/.5PT', syscoPrice: 26.45 },

  // Vegetables
  { id: 'S020', name: 'Onion, Yellow', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '1094721', syscoPackSize: '1/50LB', syscoPrice: 33.00 },
  { id: 'S021', name: 'Onion, Red', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '1094739', syscoPackSize: '1/25LB', syscoPrice: 21.25 },
  { id: 'S022', name: 'Onion, Green', category: 'Produce', subcategory: 'Vegetables', unit: 'bunch', syscoCode: '3456887', syscoPackSize: '48CT', syscoPrice: 31.20 },
  { id: 'S023', name: 'Shallots', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '0077180', syscoPackSize: '1/5LB', syscoPrice: 16.25 },
  { id: 'S024', name: 'Garlic', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '0077172', syscoPackSize: '30CT', syscoPrice: 13.50 },
  { id: 'S025', name: 'Leeks', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '3456821', syscoPackSize: '12CT', syscoPrice: 22.20 },
  { id: 'S026', name: 'Carrot', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '3456805', syscoPackSize: '1/50LB', syscoPrice: 29.00 },
  { id: 'S027', name: 'Celery', category: 'Produce', subcategory: 'Vegetables', unit: 'bunch', syscoCode: '3456813', syscoPackSize: '24CT', syscoPrice: 36.72 },
  { id: 'S028', name: 'Potato, Russet', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '1008432', syscoPackSize: '1/50LB', syscoPrice: 29.00 },
  { id: 'S029', name: 'Potato, Red', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '1008440', syscoPackSize: '1/50LB', syscoPrice: 36.00 },
  { id: 'S030', name: 'Asparagus', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '3460557', syscoPackSize: '1/11LB', syscoPrice: 48.95 },
  { id: 'S031', name: 'Bell Pepper, Green', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '4615712', syscoPackSize: '25CT', syscoPrice: 21.25 },
  { id: 'S032', name: 'Bell Pepper, Red', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '4615704', syscoPackSize: '25CT', syscoPrice: 31.25 },
  { id: 'S033', name: 'Jalapeno', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '4615720', syscoPackSize: '1/10LB', syscoPrice: 18.50 },
  { id: 'S034', name: 'Tomato, Roma', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '5418132', syscoPackSize: '1/25LB', syscoPrice: 28.00 },
  { id: 'S035', name: 'Tomato, Cherry', category: 'Produce', subcategory: 'Vegetables', unit: 'pt', syscoCode: '5418140', syscoPackSize: '12PT', syscoPrice: 30.00 },
  { id: 'S036', name: 'Cucumber', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '3456895', syscoPackSize: '24CT', syscoPrice: 13.20 },
  { id: 'S037', name: 'Cucumber, English', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '3456903', syscoPackSize: '12CT', syscoPrice: 15.00 },
  { id: 'S038', name: 'Zucchini', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '3456929', syscoPackSize: '1/20LB', syscoPrice: 27.00 },
  { id: 'S039', name: 'Squash, Yellow', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '3456911', syscoPackSize: '1/20LB', syscoPrice: 29.00 },
  { id: 'S040', name: 'Eggplant', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '1222389', syscoPackSize: '1/20LB', syscoPrice: 33.00 },
  { id: 'S041', name: 'Mushrooms, Cremini', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '4754909', syscoPackSize: '1/10LB', syscoPrice: 36.00 },
  { id: 'S042', name: 'Corn, Fresh', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '3456837', syscoPackSize: '48CT', syscoPrice: 31.20 },
  { id: 'S043', name: 'Spinach', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '3456861', syscoPackSize: '4/2.5LB', syscoPrice: 28.50 },
  { id: 'S044', name: 'Lettuce, Romaine', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '3456845', syscoPackSize: '24CT', syscoPrice: 30.00 },
  { id: 'S045', name: 'Lettuce, Iceberg', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '3456853', syscoPackSize: '24CT', syscoPrice: 26.40 },
  { id: 'S046', name: 'Lettuce, Spring Mix', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '3456879', syscoPackSize: '4/3LB', syscoPrice: 54.00 },
  { id: 'S047', name: 'Avocado', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '9230970', syscoPackSize: '48CT', syscoPrice: 36.96 },

  // Fresh Herbs
  { id: 'S060', name: 'Basil, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '2004521', syscoPackSize: '1LB', syscoPrice: 15.04 },
  { id: 'S061', name: 'Cilantro', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'bunch', syscoCode: '2004919', syscoPackSize: '30CT', syscoPrice: 19.50 },
  { id: 'S062', name: 'Parsley, Flat Leaf', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'bunch', syscoCode: '2004935', syscoPackSize: '30CT', syscoPrice: 25.50 },
  { id: 'S063', name: 'Parsley, Curly', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'bunch', syscoCode: '2004927', syscoPackSize: '30CT', syscoPrice: 22.50 },
  { id: 'S064', name: 'Mint, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'bunch', syscoCode: '2004893', syscoPackSize: '12CT', syscoPrice: 15.00 },
  { id: 'S065', name: 'Thyme, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '2005270', syscoPackSize: '1LB', syscoPrice: 17.92 },
  { id: 'S066', name: 'Rosemary, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '2005288', syscoPackSize: '1LB', syscoPrice: 15.20 },
  { id: 'S067', name: 'Sage, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '2004943', syscoPackSize: '1LB', syscoPrice: 13.44 },
  { id: 'S068', name: 'Dill, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'bunch', syscoCode: '2004901', syscoPackSize: '12CT', syscoPrice: 11.40 },
  { id: 'S069', name: 'Chives, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'bunch', syscoCode: '2004885', syscoPackSize: '12CT', syscoPrice: 17.40 },

  // Meat & Seafood
  { id: 'S080', name: 'Chicken, Breast', category: 'Meat & Seafood', subcategory: 'Poultry', unit: 'lb', syscoCode: '1860303', syscoPackSize: '40LB', syscoPrice: 154.00 },
  { id: 'S081', name: 'Chicken, Whole', category: 'Meat & Seafood', subcategory: 'Poultry', unit: 'lb', syscoCode: '1860295', syscoPackSize: '4/4LB', syscoPrice: 26.56 },
  { id: 'S082', name: 'Beef, Ground 80/20', category: 'Meat & Seafood', subcategory: 'Beef', unit: 'lb', syscoCode: '1860311', syscoPackSize: '10LB', syscoPrice: 42.50 },
  { id: 'S083', name: 'Beef, Strip Loin', category: 'Meat & Seafood', subcategory: 'Beef', unit: 'lb', syscoCode: '1860329', syscoPackSize: '1/15LB', syscoPrice: 187.50 },
  { id: 'S084', name: 'Pork, Loin', category: 'Meat & Seafood', subcategory: 'Pork', unit: 'lb', syscoCode: '1860337', syscoPackSize: '1/10LB', syscoPrice: 48.50 },
  { id: 'S085', name: 'Bacon', category: 'Meat & Seafood', subcategory: 'Pork', unit: 'lb', syscoCode: '1860345', syscoPackSize: '15LB', syscoPrice: 97.50 },
  { id: 'S086', name: 'Sausage, Italian', category: 'Meat & Seafood', subcategory: 'Pork', unit: 'lb', syscoCode: '2434371', syscoPackSize: '10LB', syscoPrice: 39.50 },
  { id: 'S087', name: 'Salmon, Fillet', category: 'Meat & Seafood', subcategory: 'Seafood', unit: 'lb', syscoCode: '9907462', syscoPackSize: '10LB', syscoPrice: 111.50 },
  { id: 'S088', name: 'Shrimp, 16/20', category: 'Meat & Seafood', subcategory: 'Seafood', unit: 'lb', syscoCode: '9907470', syscoPackSize: '10LB', syscoPrice: 98.50 },

  // Dairy for savory
  { id: 'S090', name: 'Cheese, Cheddar', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '7234958', syscoPackSize: '10LB', syscoPrice: 47.30 },
  { id: 'S091', name: 'Cheese, Parmesan Shredded', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '4067033', syscoPackSize: '4/5LB', syscoPrice: 114.00 },

  // Stock
  { id: 'S100', name: 'Stock, Chicken', category: 'Stock', subcategory: 'Chicken Stock', unit: 'qt', syscoCode: '4082200', syscoPackSize: '12/1QT', syscoPrice: 30.00 },
  { id: 'S101', name: 'Stock, Beef', category: 'Stock', subcategory: 'Beef Stock', unit: 'qt', syscoCode: '4082208', syscoPackSize: '12/1QT', syscoPrice: 33.00 },
  { id: 'S102', name: 'Stock, Vegetable', category: 'Stock', subcategory: 'Vegetable Stock', unit: 'qt', syscoCode: '4082216', syscoPackSize: '12/1QT', syscoPrice: 27.00 },

  // Pantry - Oils & Vinegars
  { id: 'S110', name: 'Oil, Olive', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'gal', syscoCode: '4082100', syscoPackSize: '6/1GAL', syscoPrice: 135.00 },
  { id: 'S111', name: 'Oil, Canola', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'gal', syscoCode: '4082794', syscoPackSize: '6/1GAL', syscoPrice: 55.50 },
  { id: 'S112', name: 'Oil, Vegetable', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'gal', syscoCode: '4082786', syscoPackSize: '6/1GAL', syscoPrice: 51.00 },
  { id: 'S113', name: 'Shortening, Vegetable', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'lb', syscoCode: '4082778', syscoPackSize: '50LB', syscoPrice: 69.00 },
  { id: 'S114', name: 'Vinegar, Balsamic', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'oz', syscoCode: '4082116', syscoPackSize: '2/1GAL', syscoPrice: 89.60 },
  { id: 'S115', name: 'Vinegar, Red Wine', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'oz', syscoCode: '4082124', syscoPackSize: '4/1GAL', syscoPrice: 76.80 },
  { id: 'S116', name: 'Vinegar, White Wine', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'oz', syscoCode: '4082132', syscoPackSize: '4/1GAL', syscoPrice: 61.44 },

  // Spices & Seasonings
  { id: 'S120', name: 'Salt, Kosher', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'lb', syscoCode: '4082872', syscoPackSize: '3LB', syscoPrice: 3.24 },
  { id: 'S121', name: 'Salt, Table', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'lb', syscoCode: '4082880', syscoPackSize: '25LB', syscoPrice: 11.25 },
  { id: 'S122', name: 'Pepper, Black Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082500', syscoPackSize: '16OZ', syscoPrice: 7.20 },
  { id: 'S123', name: 'Paprika', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082516', syscoPackSize: '16OZ', syscoPrice: 5.60 },
  { id: 'S124', name: 'Cumin, Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082524', syscoPackSize: '16OZ', syscoPrice: 6.40 },
  { id: 'S125', name: 'Oregano, Dried', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082532', syscoPackSize: '8OZ', syscoPrice: 2.40 },
  { id: 'S126', name: 'Bay Leaves', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082508', syscoPackSize: '8OZ', syscoPrice: 6.00 },
  { id: 'S127', name: 'Cinnamon, Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082888', syscoPackSize: '16OZ', syscoPrice: 10.40 },
  { id: 'S128', name: 'Nutmeg, Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082896', syscoPackSize: '16OZ', syscoPrice: 13.60 },
  { id: 'S129', name: 'Ginger, Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082904', syscoPackSize: '16OZ', syscoPrice: 8.80 },
  { id: 'S130', name: 'Cloves, Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082912', syscoPackSize: '16OZ', syscoPrice: 12.00 },
  { id: 'S131', name: 'Cardamom, Ground', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '4082920', syscoPackSize: '16OZ', syscoPrice: 29.60 },

  // Condiments
  { id: 'S140', name: 'Soy Sauce', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '4082540', syscoPackSize: '4/1GAL', syscoPrice: 76.80 },
  { id: 'S141', name: 'Sunflower Seeds', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'lb', syscoCode: '4082674', syscoPackSize: '25LB', syscoPrice: 81.25 },

  // Canned Goods
  { id: 'S150', name: 'Tomatoes, Diced Canned', category: 'Pantry', subcategory: 'Canned Goods', unit: 'can', syscoCode: '4082300', syscoPackSize: '6/#10', syscoPrice: 17.10 },
  { id: 'S151', name: 'Tomato Paste', category: 'Pantry', subcategory: 'Canned Goods', unit: 'can', syscoCode: '4082308', syscoPackSize: '6/#10', syscoPrice: 11.70 },
  { id: 'S152', name: 'Tomatoes, Crushed Canned', category: 'Pantry', subcategory: 'Canned Goods', unit: 'can', syscoCode: '4082316', syscoPackSize: '6/#10', syscoPrice: 18.90 },

  // Pasta & Rice
  { id: 'S160', name: 'Pasta, Spaghetti', category: 'Pantry', subcategory: 'Pasta & Rice', unit: 'lb', syscoCode: '4082400', syscoPackSize: '20LB', syscoPrice: 25.00 },
  { id: 'S161', name: 'Pasta, Penne', category: 'Pantry', subcategory: 'Pasta & Rice', unit: 'lb', syscoCode: '4082408', syscoPackSize: '20LB', syscoPrice: 25.00 },
  { id: 'S162', name: 'Rice, Long Grain', category: 'Pantry', subcategory: 'Pasta & Rice', unit: 'lb', syscoCode: '4082416', syscoPackSize: '50LB', syscoPrice: 42.50 },
  { id: 'S163', name: 'Rice, Arborio', category: 'Pantry', subcategory: 'Pasta & Rice', unit: 'lb', syscoCode: '4082424', syscoPackSize: '10LB', syscoPrice: 25.00 },

  // Frozen
  { id: 'S170', name: 'Potato, Breakfast Frozen', category: 'Frozen Foods', subcategory: 'Frozen Vegetables', unit: 'oz', syscoCode: '', syscoPackSize: '6/6LB', syscoPrice: 79.92 },

  // Additional Produce - Vegetables (needsPricing: true = needs vendor/price update)
  { id: 'S200', name: 'Tomato, 5x6', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '', syscoPackSize: '1/25LB', syscoPrice: 32.00, needsPricing: true },
  { id: 'S201', name: 'Potato, Baby Yukon', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/50LB', syscoPrice: 42.00, needsPricing: true },
  { id: 'S202', name: 'Potato, Sweet', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/40LB', syscoPrice: 38.00, needsPricing: true },
  { id: 'S203', name: 'Brussels Sprouts', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/25LB', syscoPrice: 45.00, needsPricing: true },
  { id: 'S204', name: 'Broccoli, Florets', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '4/3LB', syscoPrice: 32.00, needsPricing: true },
  { id: 'S205', name: 'Chili, Fresno', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 24.00, needsPricing: true },
  { id: 'S206', name: 'Grapes, Red', category: 'Produce', subcategory: 'Fruit', unit: 'lb', syscoCode: '', syscoPackSize: '1/18LB', syscoPrice: 42.00, needsPricing: true },
  { id: 'S207', name: 'Potato, Baker', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/50LB', syscoPrice: 32.00, needsPricing: true },

  // Additional Mushrooms
  { id: 'S210', name: 'Mushrooms, Oyster', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/5LB', syscoPrice: 28.00, needsPricing: true },
  { id: 'S211', name: 'Mushrooms, Portobello', category: 'Produce', subcategory: 'Vegetables', unit: 'ea', syscoCode: '', syscoPackSize: '5LB', syscoPrice: 22.00, needsPricing: true },
  { id: 'S212', name: 'Mushrooms, White', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 32.00, needsPricing: true },

  // Additional Fresh Herbs
  { id: 'S220', name: 'Oregano, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '', syscoPackSize: '1LB', syscoPrice: 14.00, needsPricing: true },
  { id: 'S221', name: 'Ginger, Fresh', category: 'Produce', subcategory: 'Vegetables', unit: 'lb', syscoCode: '', syscoPackSize: '1/5LB', syscoPrice: 18.00, needsPricing: true },
  { id: 'S222', name: 'Tarragon, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '', syscoPackSize: '1LB', syscoPrice: 16.00, needsPricing: true },
  { id: 'S223', name: 'Chervil, Fresh', category: 'Produce', subcategory: 'Fresh Herbs', unit: 'oz', syscoCode: '', syscoPackSize: '1LB', syscoPrice: 18.00, needsPricing: true },

  // Additional Cheeses
  { id: 'S230', name: 'Cheese, Mozzarella', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '', syscoPackSize: '6/5LB', syscoPrice: 89.00, needsPricing: true },
  { id: 'S231', name: 'Gruyere', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 145.00, needsPricing: true },
  { id: 'S232', name: 'Cheese, Monterey Jack', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 52.00, needsPricing: true },
  { id: 'S233', name: 'Cheese, Goat', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '', syscoPackSize: '2/2LB', syscoPrice: 38.00, needsPricing: true },
  { id: 'S234', name: 'Cheese, Mozzarella Balls', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'oz', syscoCode: '', syscoPackSize: '2/3LB', syscoPrice: 42.00, needsPricing: true },

  // Additional Proteins
  { id: 'S240', name: 'Chicken, WOG', category: 'Meat & Seafood', subcategory: 'Poultry', unit: 'lb', syscoCode: '', syscoPackSize: '8/3LB', syscoPrice: 42.00, needsPricing: true },
  { id: 'S241', name: 'Pork, Chops', category: 'Meat & Seafood', subcategory: 'Pork', unit: 'oz', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 58.00, needsPricing: true },
  { id: 'S242', name: 'Steak, Flatiron', category: 'Meat & Seafood', subcategory: 'Beef', unit: 'oz', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 89.00, needsPricing: true },
  { id: 'S243', name: 'Steak, NY Strip', category: 'Meat & Seafood', subcategory: 'Beef', unit: 'oz', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 145.00, needsPricing: true },

  // Fish Stock
  { id: 'S250', name: 'Stock, Fish', category: 'Stock', subcategory: 'Fish Stock', unit: 'qt', syscoCode: '', syscoPackSize: '12/1QT', syscoPrice: 36.00, needsPricing: true },

  // Base Concentrates
  { id: 'S251', name: 'Base, Beef', category: 'Stock', subcategory: 'Beef Stock', unit: 'oz', syscoCode: '', syscoPackSize: '6/1LB', syscoPrice: 48.00, needsPricing: true },
  { id: 'S252', name: 'Base, Chicken', category: 'Stock', subcategory: 'Chicken Stock', unit: 'oz', syscoCode: '', syscoPackSize: '6/1LB', syscoPrice: 42.00, needsPricing: true },
  { id: 'S253', name: 'Base, Vegetable', category: 'Stock', subcategory: 'Vegetable Stock', unit: 'oz', syscoCode: '', syscoPackSize: '6/1LB', syscoPrice: 38.00, needsPricing: true },

  // Additional Condiments
  { id: 'S260', name: 'Mustard, Dijon', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '6/12OZ', syscoPrice: 32.00, needsPricing: true },
  { id: 'S261', name: 'Mayonnaise', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '4/1GAL', syscoPrice: 58.00, needsPricing: true },
  { id: 'S262', name: 'Juice, Lemon', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '12/32OZ', syscoPrice: 42.00, needsPricing: true },
  { id: 'S263', name: 'Olives, Kalamata', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '6/2LB', syscoPrice: 68.00, needsPricing: true },
  { id: 'S264', name: 'Worcestershire Sauce', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '4/1GAL', syscoPrice: 52.00, needsPricing: true },
  { id: 'S265', name: 'Tomato Paste, Tube', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '12/4.5OZ', syscoPrice: 28.00, needsPricing: true },

  // Oils & Vinegars
  { id: 'S270', name: 'Oil, Sesame', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'oz', syscoCode: '', syscoPackSize: '12/12OZ', syscoPrice: 68.00, needsPricing: true },
  { id: 'S271', name: 'Vinegar, Apple Cider', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'oz', syscoCode: '', syscoPackSize: '4/1GAL', syscoPrice: 42.00, needsPricing: true },
  { id: 'S272', name: 'Oil, Extra Virgin Olive', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'qt', syscoCode: '', syscoPackSize: '6/1QT', syscoPrice: 89.00, needsPricing: true },

  // Cooking Wines
  { id: 'S275', name: 'Wine, White Cooking', category: 'Pantry', subcategory: 'Cooking Wines', unit: 'qt', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 72.00, needsPricing: true },
  { id: 'S276', name: 'Wine, Red Cooking', category: 'Pantry', subcategory: 'Cooking Wines', unit: 'qt', syscoCode: '', syscoPackSize: '12/750ML', syscoPrice: 72.00, needsPricing: true },

  // Nuts & Seeds
  { id: 'S280', name: 'Pine Nuts', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'oz', syscoCode: '', syscoPackSize: '1/5LB', syscoPrice: 125.00, needsPricing: true },
  { id: 'S281', name: 'Sesame Seeds, White', category: 'Pantry', subcategory: 'Nuts & Seeds', unit: 'oz', syscoCode: '', syscoPackSize: '6/1LB', syscoPrice: 32.00, needsPricing: true },

  // Specialty Items
  { id: 'S290', name: 'Bonito Flakes', category: 'Pantry', subcategory: 'Asian', unit: 'oz', syscoCode: '', syscoPackSize: '10/3.5OZ', syscoPrice: 65.00, needsPricing: true },
  { id: 'S291', name: 'Bread Crumbs, Panko', category: 'Pantry', subcategory: 'Breading', unit: 'lb', syscoCode: '', syscoPackSize: '6/2.5LB', syscoPrice: 38.00, needsPricing: true },
  { id: 'S292', name: 'Cranberries, Dried', category: 'Pantry', subcategory: 'Dried Fruits', unit: 'lb', syscoCode: '', syscoPackSize: '1/10LB', syscoPrice: 52.00, needsPricing: true },
  { id: 'S293', name: 'Juice, Yuzu', category: 'Pantry', subcategory: 'Asian', unit: 'oz', syscoCode: '', syscoPackSize: '12/5OZ', syscoPrice: 85.00, needsPricing: true },

  // Bakery
  { id: 'S295', name: 'Baguette', category: 'Bakery & Bread', subcategory: 'Bread', unit: 'ea', syscoCode: '', syscoPackSize: '24CT', syscoPrice: 42.00, needsPricing: true },

  // Dry Goods
  { id: 'S296', name: 'Arborio Rice', category: 'Pantry', subcategory: 'Pasta & Rice', unit: 'lb', syscoCode: '', syscoPackSize: '1/12LB', syscoPrice: 28.00, needsPricing: true },
  { id: 'S297', name: 'Chutney, Major Grey', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '4758962', syscoPackSize: '6/26OZ', syscoPrice: 42.50 },
  { id: 'S298', name: 'Curry Powder', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', vendor: 'Spiceology', vendorCode: 'SPL-10142', vendorPackSize: '1/16OZ', vendorPrice: 14.95 },
  { id: 'S299', name: 'Pesto, Basil', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '6/30OZ', syscoPrice: 68.00, needsPricing: true },
  { id: 'S300', name: 'Arugula', category: 'Produce', subcategory: 'Vegetables', unit: 'oz', syscoCode: '', syscoPackSize: '4/5LB', syscoPrice: 42.00, needsPricing: true },
  { id: 'S301', name: 'Artichoke Hearts, Marinated', category: 'Pantry', subcategory: 'Canned Goods', unit: 'oz', syscoCode: '', syscoPackSize: '6/14OZ', syscoPrice: 52.00, needsPricing: true },
  { id: 'S302', name: 'Tomatoes, Sun-Dried', category: 'Pantry', subcategory: 'Canned Goods', unit: 'oz', syscoCode: '', syscoPackSize: '6/7OZ', syscoPrice: 38.00, needsPricing: true },
  { id: 'S303', name: 'Cheese, Provolone', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', syscoCode: '', syscoPackSize: '8/1LB', syscoPrice: 48.00, needsPricing: true },
  { id: 'S304', name: 'Ham, Black Forest', category: 'Meat & Seafood', subcategory: 'Deli Meats', unit: 'lb', syscoCode: '', syscoPackSize: '2/6LB', syscoPrice: 72.00, needsPricing: true },
  { id: 'S305', name: 'Salami, Genoa', category: 'Meat & Seafood', subcategory: 'Deli Meats', unit: 'lb', syscoCode: '', syscoPackSize: '2/4LB', syscoPrice: 56.00, needsPricing: true },
  { id: 'S306', name: 'Pepperoncini', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '4/1GAL', syscoPrice: 42.00, needsPricing: true },
  { id: 'S308', name: 'Ciabatta Roll', category: 'Bakery & Bread', subcategory: 'Bread', unit: 'ea', syscoCode: '', syscoPackSize: '48CT', syscoPrice: 36.00, needsPricing: true },
  { id: 'S309', name: 'Focaccia Bread', category: 'Bakery & Bread', subcategory: 'Bread', unit: 'ea', syscoCode: '', syscoPackSize: '12CT', syscoPrice: 32.00, needsPricing: true },
  { id: 'S310', name: 'Mozzarella, Fresh', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'oz', syscoCode: '', syscoPackSize: '6/1LB', syscoPrice: 54.00, needsPricing: true },
  { id: 'S311', name: 'Croissant, Sandwich', category: 'Bakery & Bread', subcategory: 'Bread', unit: 'ea', syscoCode: '', syscoPackSize: '48CT', syscoPrice: 42.00, needsPricing: true },
  { id: 'S312', name: 'Italian Seasoning', category: 'Pantry', subcategory: 'Spices & Seasonings', unit: 'oz', syscoCode: '', syscoPackSize: '6/6OZ', syscoPrice: 24.00, needsPricing: true, conversions: { tbsp: 0.176, tsp: 0.059 } },
  { id: 'S313', name: 'Oil, Olive/Canola Blend', category: 'Pantry', subcategory: 'Oils & Vinegars', unit: 'oz', syscoCode: '', syscoPackSize: '6/1GAL', syscoPrice: 95.00, needsPricing: true },
  { id: 'S314', name: 'Balsamic Glaze', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '', syscoPackSize: '6/12OZ', syscoPrice: 48.00, needsPricing: true },
  { id: 'S315', name: 'Falafel Balls', category: 'Pantry', subcategory: 'Prepared', unit: 'oz', syscoCode: '4774225', syscoPackSize: '4/4LB', syscoPrice: 66.95, needsPricing: true },
  { id: 'S316', name: 'Hummus, Traditional', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', syscoCode: '9669151', syscoPackSize: '4/3.75LB', syscoPrice: 61.95, needsPricing: true },
  { id: 'S317', name: 'Tortilla, Garlic Herb 12in', category: 'Bakery & Bread', subcategory: 'Bread', unit: 'ea', syscoCode: '', syscoPackSize: '12/12CT', syscoPrice: 42.00, needsPricing: true },
  { id: 'S318', name: 'Italian Dressing', category: 'Pantry', subcategory: 'Condiments', unit: 'oz', vendor: 'Costco', vendorPackSize: '2/28OZ', vendorPrice: 9.89, needsPricing: true },
  { id: 'S319', name: 'Turkey Breast, Sliced', category: 'Meat & Seafood', subcategory: 'Deli Meats', unit: 'oz', vendor: 'Costco', vendorPackSize: '1/20OZ', vendorPrice: 15.39, needsPricing: true },
  { id: 'S320', name: 'Cheese, Feta Crumbled', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'oz', vendor: 'Costco', vendorPackSize: '1/24OZ', vendorPrice: 7.69, needsPricing: true },
  { id: 'S321', name: 'Croutons, Seasoned', category: 'Pantry', subcategory: 'Bread', unit: 'oz', vendor: 'Restaurant Depot', vendorPackSize: '4/2.5LB', vendorPrice: 29.99, needsPricing: true },

];

// Added 12/13/2025
export const additionalIngredients = [
  { id: 'SYS-2644625', name: 'Cranberry Juice Cocktail, Simply', category: 'Beverages', subcategory: 'Juice', unit: 'ea', vendor: 'Sysco', vendorCode: '2644625', packSize: '12/11.5OZ', casePrice: 30.75, unitPrice: 2.56 }
];

// Combined ingredients list
export const ingredientsList = [...bakingIngredientsList, ...savoryIngredientsList, ...shamrockIngredientsList, ...additionalIngredients, ...syscoOrderGuide];

// Re-export shamrock list for other components
export { shamrockIngredientsList };

// Vendor names
export const vendorNames = {
  sysco: 'Sysco',
  shamrock: 'Shamrock',
  merit: 'Merit Foods',
  peddlers: "Peddler's",
  amazon: 'Amazon',
  restaurantDepot: 'Restaurant Depot',
  costco: 'Costco',
  frys: "Fry's",
  safeway: 'Safeway',
  houseMade: 'House-Made'
};

// Get item by PCC stock code
export const getItemByPccStock = (pccStock) => {
  return ingredientsList.find(item => item.syscoCode === pccStock);
};

// Format date helper
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export { syscoOrderGuide, getSyscoBySUPC, getSyscoByCategory } from './syscoOrderGuide';
