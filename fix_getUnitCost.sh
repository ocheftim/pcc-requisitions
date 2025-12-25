#!/bin/bash
FILE="src/pages/requisitions/InstructorRequisitionPage.jsx"

# Create the new function
NEW_FUNCTION="  const getUnitCost = (ingredient) => {
    if (ingredient.isCustom) {
      return ingredient.unitCost || 0;
    }
    
    const vendor = ingredient.preferredVendor || 'sysco';
    let casePrice = 0;
    let packSize = '';
    
    if (vendor === 'sysco') {
      casePrice = ingredient.syscoPrice || 0;
      packSize = ingredient.syscoPackSize || '';
    } else if (vendor === 'shamrock') {
      casePrice = ingredient.shamrockPrice || 0;
      packSize = ingredient.shamrockPackSize || '';
    } else if (vendor === 'peddlers') {
      casePrice = ingredient.peddlersPrice || 0;
      packSize = ingredient.peddlersPackSize || '';
    }
    
    if (!casePrice && ingredient.vendors?.[vendor]) {
      casePrice = ingredient.vendors[vendor].casePrice || 0;
      packSize = ingredient.vendors[vendor].packSize || '';
    }
    
    const unitsPerCase = parseCasePack(packSize);
    return unitsPerCase > 0 ? casePrice / unitsPerCase : 0;
  };"

# Use sed to replace the function
sed -i '' '/const getUnitCost = (ingredient) => {/,/^  };$/c\
'"$NEW_FUNCTION"'
' "$FILE"

echo "✅ Fixed getUnitCost function"
