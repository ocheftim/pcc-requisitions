import React, { useState, useEffect } from 'react';
import ImportRequisitions from './ImportRequisitions';
import BulkIngredientUpdate from './BulkIngredientUpdate';

const RequisitionImportContainer = ({ 
  ingredients = [],
  vendors = [],
  onCreateRequisitions,
  onUpdateIngredients
}) => {
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [lastUploadedData, setLastUploadedData] = useState(null);
  const [triggerRevalidation, setTriggerRevalidation] = useState(0);

  const handleImportComplete = (results, rawData) => {
    console.log('Import validation complete:', results);
    setValidationResults(results);
    setLastUploadedData(rawData);
    if (results.summary.needsAttention.length > 0) {
      setShowBulkUpdate(true);
    }
  };

  const handleIngredientUpdates = async (updates) => {
    console.log('Updating ingredients:', updates);
    if (onUpdateIngredients) {
      await onUpdateIngredients(updates);
    }
    setShowBulkUpdate(false);
    
    // Trigger automatic revalidation
    setTriggerRevalidation(prev => prev + 1);
    
    alert(`✅ Successfully added ${Object.keys(updates).length} ingredient(s)! Revalidating...`);
  };

  return (
    <>
      <ImportRequisitions
        key={triggerRevalidation}
        ingredients={ingredients}
        vendors={vendors}
        onImportComplete={handleImportComplete}
        autoRevalidateData={lastUploadedData}
        triggerRevalidation={triggerRevalidation}
      />
      {showBulkUpdate && validationResults && (
        <BulkIngredientUpdate
          ingredientsNeedingAttention={validationResults.summary.needsAttention}
          vendors={vendors}
          onUpdateIngredients={handleIngredientUpdates}
          onClose={() => setShowBulkUpdate(false)}
        />
      )}
    </>
  );
};

export default RequisitionImportContainer;
