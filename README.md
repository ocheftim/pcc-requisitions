# ToqueWorks Lab Requisition Module

A standalone React application for managing culinary lab requisitions with multi-recipe selection, ingredient consolidation, and real-time budget tracking.

## Features

✨ **Multi-Recipe Selection** - Select multiple recipes with checkboxes  
📊 **Real-Time Budget Tracking** - See costs instantly as you select recipes  
🔄 **Smart Consolidation** - Automatically merges duplicate ingredients  
💰 **Cost Analysis** - Detailed breakdown by category with vendor pricing  
📋 **Shamrock Integration** - Maps to Shamrock Foods vendor products  
🎯 **Class Size Scaling** - Automatically scales recipes for your class

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation

```bash
# Navigate to the module directory
cd requisition-module

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:3000`

## Usage

### 1. Configure Lab Settings
- **Class Size**: Set the number of students (default: 24)
- **Budget Threshold**: Set your budget limit (default: $500)

The system automatically calculates servings needed:
- Students are paired (e.g., 24 students = 12 pairs)
- Each pair gets 6 servings per recipe
- Total servings per recipe = 72 in this example

### 2. Select Recipes
- Click on recipe cards to select/deselect
- Use "Select All" or "Clear All" for bulk actions
- See individual recipe costs as scaled for your class size

### 3. Review Consolidated Requisition
- Ingredients are automatically consolidated across all selected recipes
- Items grouped by category (Dairy & Eggs, Baking, Produce)
- Real-time budget tracking shows if you're under/over budget
- Toggle "Show Details" to see which recipes use each ingredient

### 4. Generate Output
- **Generate PDF**: Export requisition to PDF
- **Email to Shamrock**: Send directly to vendor
- **Save Draft**: Save for later modification
- **Print Preview**: Browser print dialog

## Project Structure

```
requisition-module/
├── public/
│   └── index.html           # HTML template with Tailwind CDN
├── src/
│   ├── components/
│   │   ├── RequisitionModule.jsx    # Main container component
│   │   ├── RecipeCard.jsx           # Individual recipe display
│   │   └── RequisitionDisplay.jsx   # Consolidated requisition view
│   ├── data/
│   │   ├── quickBreadsRecipes.js    # Sample recipe data
│   │   └── shamrockMapping.js       # Vendor product mapping
│   ├── App.js               # Root component
│   └── index.js             # Entry point
├── package.json
└── README.md
```

## Data Structure

### Recipes (`quickBreadsRecipes.js`)
Each recipe includes:
- `id`: Unique identifier
- `name`: Recipe name
- `servings`: Base serving size
- `category`: Recipe category
- `ingredients`: Array of ingredients with:
  - `name`: Ingredient name
  - `quantity`: Amount needed
  - `unit`: Measurement unit
  - `shamrockCode`: Links to vendor product

### Vendor Mapping (`shamrockMapping.js`)
Maps internal codes to Shamrock products:
- `shamrockItemCode`: Vendor product code
- `shamrockDescription`: Vendor product description
- `category`: Product category
- `unitPrice`: Cost per unit
- `unit`: Vendor unit (lb, dozen, quart, etc.)
- `conversionFactor`: Recipe-to-vendor unit conversion

## Customization

### Adding New Recipes
Edit `src/data/quickBreadsRecipes.js`:

```javascript
{
  id: 'qb-005',
  name: 'Cornbread',
  servings: 16,
  category: 'Quick Breads',
  week: 3,
  course: 'CUL 140',
  ingredients: [
    { name: 'Cornmeal', quantity: 2, unit: 'cups', shamrockCode: 'GRN-001' },
    // ... more ingredients
  ]
}
```

### Adding Vendor Products
Edit `src/data/shamrockMapping.js`:

```javascript
'GRN-001': {
  shamrockItemCode: '40001',
  shamrockDescription: 'Cornmeal, Yellow, 5lb',
  category: 'GRAINS',
  unitPrice: 8.50,
  unit: 'lb',
  packSize: '5lb',
  conversionFactor: 3, // 1 lb = 3 cups
}
```

## Integration with ToqueWorks

This module is designed to be standalone but can be integrated into the main ToqueWorks application:

1. Copy component files to `src/pages/` or `src/components/`
2. Import data files into your existing data structure
3. Add routing in your main app
4. Connect to your existing settings/authentication

## Future Enhancements

- [ ] PDF generation with jsPDF
- [ ] Email integration with vendor API
- [ ] Return tracking after lab session
- [ ] Historical data and analytics
- [ ] Template library for common recipe combinations
- [ ] Multi-week planning
- [ ] Inventory management integration

## Testing

Manual testing checklist:
- [ ] Select single recipe - verify cost calculation
- [ ] Select multiple recipes with shared ingredients - verify consolidation
- [ ] Adjust class size - verify servings scale correctly
- [ ] Set budget threshold - verify over/under budget display
- [ ] Toggle details - verify recipe attribution shows/hides
- [ ] Clear all / Select all buttons work
- [ ] Print preview displays correctly

## License

Private - ToqueWorks Culinary Education Platform

## Contact

For questions or support, contact the ToqueWorks development team.

---

**Version:** 1.0.0  
**Last Updated:** November 2025
