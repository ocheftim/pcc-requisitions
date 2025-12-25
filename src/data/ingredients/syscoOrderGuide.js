/**
 * Sysco Order Guide - Pima Community College Culinary Arts
 * Account: 049-699207
 * Last Updated: 2025-12-18
 */

export const syscoOrderGuide = [
  { id: 'SYS2456846', name: 'Milk, Whole Homogenized', category: 'Dairy & Eggs', subcategory: 'Milk', unit: 'gal', vendor: 'Sysco', syscoCode: '2456846', syscoPackSize: '6/.5GAL', syscoPrice: 19.59, brand: 'Wholesome Farms' },
  { id: 'SYS2491702', name: 'Buttermilk, 1% Low Fat', category: 'Dairy & Eggs', subcategory: 'Milk', unit: 'gal', vendor: 'Sysco', syscoCode: '2491702', syscoPackSize: '6/.5GAL', syscoPrice: 15.99, splitPrice: 3.45, brand: 'Wholesome Farms' },
  { id: 'SYS4828802', name: 'Cream, Heavy Whipping 36%', category: 'Dairy & Eggs', subcategory: 'Cream', unit: 'oz', vendor: 'Sysco', syscoCode: '4828802', syscoPackSize: '12/32OZ', syscoPrice: 48.29, brand: 'Wholesome Farms' },
  { id: 'SYS0284861', name: 'Sour Cream', category: 'Dairy & Eggs', subcategory: 'Cream', unit: 'lb', vendor: 'Sysco', syscoCode: '0284861', syscoPackSize: '2/5LB', syscoPrice: 19.45, brand: 'Wholesome Farms' },
  { id: 'SYS7485170', name: 'Butter, Unsalted AA', category: 'Dairy & Eggs', subcategory: 'Butter', unit: 'lb', vendor: 'Sysco', syscoCode: '7485170', syscoPackSize: '30/1LB', syscoPrice: 84.34, brand: 'Wholesome Farms Imperial' },
  { id: 'SYS3029475', name: 'Butter Chips, Salted Continental', foodserviceOnly: true, category: 'Dairy & Eggs', subcategory: 'Butter', unit: 'lb', vendor: 'Sysco', syscoCode: '3029475', syscoPackSize: '4/4.25LB', syscoPrice: 69.69, brand: 'Wholesome Farms Imperial' },
  { id: 'SYS2105823', name: 'Eggs, Large Grade AA White', category: 'Dairy & Eggs', subcategory: 'Eggs', unit: 'ea', vendor: 'Sysco', syscoCode: '2105823', syscoPackSize: '1/15DZ', syscoPrice: 34.89, brand: 'Wholesome Farms' },
  { id: 'SYS5134365', name: 'Eggs, Scramble Mix Liquid', foodserviceOnly: true, category: 'Dairy & Eggs', subcategory: 'Eggs', unit: 'lb', vendor: 'Sysco', syscoCode: '5134365', syscoPackSize: '15/2LB', syscoPrice: 87.99, brand: 'Wholesome Farms Imperial' },
  { id: 'SYS2822353', name: 'Cheese, Cheddar Sharp Shredded', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', vendor: 'Sysco', syscoCode: '2822353', syscoPackSize: '4/5LB', syscoPrice: 54.67, splitPrice: 16.12, brand: 'Block & Barrel' },
  { id: 'SYS0873301', name: 'Cheese, Parmesan Shredded', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', vendor: 'Sysco', syscoCode: '0873301', syscoPackSize: '4/5LB', syscoPrice: 102.99, splitPrice: 28.65, brand: 'Arrezzio' },
  { id: 'SYS2329437', name: 'Cheese, Mozzarella Shredded WM', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', vendor: 'Sysco', syscoCode: '2329437', syscoPackSize: '4/5LB', syscoPrice: 52.27, splitPrice: 15.32, brand: 'Arrezzio Imperial' },
  { id: 'SYS3716750', name: 'Cheese, Cream Loaf', category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'lb', vendor: 'Sysco', syscoCode: '3716750', syscoPackSize: '6/3LB', syscoPrice: 83.49, brand: 'Philadelphia' },
  { id: 'SYS3717279', name: 'Cheese, Cream Cups 1oz', foodserviceOnly: true, category: 'Dairy & Eggs', subcategory: 'Cheese', unit: 'ea', vendor: 'Sysco', syscoCode: '3717279', syscoPackSize: '100/1OZ', syscoPrice: 47.65, brand: 'Philadelphia' },
  { id: 'SYS1037316', name: 'Yogurt, Plain Low Fat', category: 'Dairy & Eggs', subcategory: 'Yogurt', unit: 'oz', vendor: 'Sysco', syscoCode: '1037316', syscoPackSize: '6/32OZ', syscoPrice: 30.95, splitPrice: 5.95, brand: 'Dannon' },
];

export const syscoOrderGuideCount = syscoOrderGuide.length;
export const getSyscoBySUPC = (supc) => syscoOrderGuide.find(i => i.syscoCode === supc);
export const getSyscoByCategory = (category) => syscoOrderGuide.filter(i => i.category === category);
export const getSyscoBySubcategory = (subcategory) => syscoOrderGuide.filter(i => i.subcategory === subcategory);
