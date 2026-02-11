const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xoswclwjsmwpemcrvorp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc3djbHdqc213cGVtY3J2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTQ1NzQsImV4cCI6MjA3OTk5MDU3NH0.JexQn0yFDURVI-g5ILj9Dfj7LHAQyV34clLDA2Uw1eE');

const items = [
  {name:'Bittersweet Couverture',quantity:6,unit:'lb',category:'Baking'},
  {name:'Milk Couverture',quantity:6,unit:'lb',category:'Baking'},
  {name:'White Couverture',quantity:6,unit:'lb',category:'Baking'},
  {name:'Cocoa Powder',quantity:6,unit:'oz',category:'Baking'},
  {name:'Glucose Syrup',quantity:17,unit:'oz',category:'Baking'},
  {name:'Cream, Heavy',quantity:10,unit:'qt',category:'Dairy'},
  {name:'Milk, Whole',quantity:1,unit:'pt',category:'Dairy'},
  {name:'Butter, Unsalted',quantity:4,unit:'lb',category:'Dairy'},
  {name:'Eggs, Large',quantity:1,unit:'flat',category:'Dairy'},
  {name:'Sugar, Granulated',quantity:14,unit:'lb',category:'Pantry'},
  {name:'Sugar, Powdered',quantity:4,unit:'lb',category:'Pantry'},
  {name:'Sugar, Brown',quantity:1,unit:'lb',category:'Pantry'},
  {name:'All-Purpose Flour',quantity:2,unit:'lb',category:'Pantry'},
  {name:'Bread Flour',quantity:8,unit:'oz',category:'Pantry'},
  {name:'Almond Flour',quantity:1,unit:'lb',category:'Pantry'},
  {name:'Gelatin Sheets',quantity:24,unit:'ea',category:'Pantry'},
  {name:'Gelatin, Powdered',quantity:6,unit:'oz',category:'Pantry'},
  {name:'Pectin',quantity:4,unit:'oz',category:'Pantry'},
  {name:'Almond Paste',quantity:12,unit:'oz',category:'Pantry'},
  {name:'Almonds, Sliced',quantity:1,unit:'lb',category:'Pantry'},
  {name:'Coconut Oil',quantity:16,unit:'oz',category:'Pantry'},
  {name:'Sunflower Oil',quantity:4,unit:'oz',category:'Pantry'},
  {name:'Honey',quantity:6,unit:'oz',category:'Pantry'},
  {name:'Golden Syrup',quantity:7,unit:'oz',category:'Pantry'},
  {name:'Salt, Fine Sea',quantity:1,unit:'can',category:'Pantry'},
  {name:'Cardamom',quantity:2,unit:'oz',category:'Spices'},
  {name:'Vanilla Bean',quantity:6,unit:'ea',category:'Pantry'},
  {name:'Vanilla Extract',quantity:2,unit:'oz',category:'Pantry'},
  {name:'Vanilla Bean Paste',quantity:2,unit:'oz',category:'Pantry'},
  {name:'Lemon',quantity:16,unit:'ea',category:'Produce'},
  {name:'Orange',quantity:10,unit:'ea',category:'Produce'},
  {name:'Raspberries',quantity:3,unit:'pt',category:'Produce'},
  {name:'Blackberries',quantity:2,unit:'pt',category:'Produce'},
  {name:'Strawberries',quantity:1,unit:'pt',category:'Produce'},
  {name:'Mint',quantity:2,unit:'bu',category:'Produce'},
  {name:'Orange Juice',quantity:1,unit:'qt',category:'Pantry'},
  {name:'Pineapple Juice',quantity:1,unit:'can',category:'Pantry'},
  {name:'Passion Fruit Puree',quantity:1,unit:'box',category:'Pantry'},
  {name:'Orange Liqueur',quantity:5,unit:'oz',category:'Wine & Spirits'},
  {name:'Fruit Liqueur',quantity:5,unit:'oz',category:'Wine & Spirits'},
  {name:'Brandy',quantity:1,unit:'oz',category:'Wine & Spirits'},
  {name:'Scotch',quantity:1,unit:'oz',category:'Wine & Spirits'},
  {name:'Gel Colors, Assorted',quantity:1,unit:'set',category:'Supplies'}
];

(async()=>{
  const {data, error} = await supabase.from('requisitions')
    .update({items: JSON.stringify(items)})
    .eq('course','CUL244')
    .gte('class_date','2026-01-27')
    .lte('class_date','2026-01-27');
  if(error) console.log('Error:', error);
  else console.log('Updated CUL244 Module 3 with', items.length, 'items');
})();
