import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, AlertTriangle, Package, DollarSign, TrendingUp } from 'lucide-react';

const ImportRequisitions = ({ 
  ingredients = [], 
  vendors = [],
  onImportComplete,
  autoRevalidateData = null,
  triggerRevalidation = 0
}) => {
  const [importData, setImportData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (autoRevalidateData && triggerRevalidation > 0) {
      console.log('Auto-revalidating with updated ingredients...');
      const validation = validateRequisitions(autoRevalidateData);
      setValidationResults(validation);
      if (onImportComplete) {
        onImportComplete(validation, autoRevalidateData);
      }
    }
  }, [triggerRevalidation, ingredients]);

  const validateRequisitions = (requisitionsData) => {
    const results = {
      requisitions: [],
      summary: {
        totalRequisitions: 0,
        totalItems: 0,
        readyToOrder: 0,
        missingIngredients: 0,
        missingVendor: 0,
        missingPricing: 0,
        missingYield: 0,
        needsAttention: []
      }
    };

    requisitionsData.requisitions.forEach(req => {
      const reqResult = {
        ...req,
        items: [],
        stats: { total: 0, ready: 0, needsWork: 0 }
      };

      req.items.forEach(item => {
        const originalIngredientName = item.ingredient;
        const ingredient = ingredients.find(ing => 
          ing.name.toLowerCase() === originalIngredientName.toLowerCase()
        );

        const itemValidation = {
          ...item,
          originalName: originalIngredientName,
          matched: !!ingredient,
          ingredient: ingredient || null,
          issues: [],
          status: 'unknown',
          apCalculation: null
        };

        if (!ingredient) {
          itemValidation.issues.push('Ingredient not in database');
          itemValidation.status = 'missing';
          results.summary.missingIngredients++;
        } else {
          if (!ingredient.primaryVendorId) {
            itemValidation.issues.push('No vendor assigned');
            itemValidation.status = 'needs-vendor';
            results.summary.missingVendor++;
          }
          if (!ingredient.apCost) {
            itemValidation.issues.push('No AP pricing data');
            itemValidation.status = 'needs-pricing';
            results.summary.missingPricing++;
          }
          if (!ingredient.yieldPercent) {
            itemValidation.issues.push('No yield % for AP/EP conversion');
            itemValidation.status = 'needs-yield';
            results.summary.missingYield++;
          }

          if (item.requestedQty && ingredient.yieldPercent) {
            const yieldPercent = ingredient.yieldPercent;
            const epQty = item.requestedQty;
            const apQty = epQty / (yieldPercent / 100);
            
            itemValidation.apCalculation = {
              epRequested: epQty,
              epUnit: item.unit,
              yieldPercent: yieldPercent,
              apNeeded: apQty,
              apUnit: ingredient.purchaseUnit || item.unit
            };
          }

          if (itemValidation.issues.length === 0 && item.requestedQty) {
            itemValidation.status = 'ready';
            results.summary.readyToOrder++;
            reqResult.stats.ready++;
          } else if (itemValidation.issues.length > 0) {
            reqResult.stats.needsWork++;
          }
        }

        reqResult.items.push(itemValidation);
        reqResult.stats.total++;
        results.summary.totalItems++;
      });

      results.requisitions.push(reqResult);
      results.summary.totalRequisitions++;
    });

    results.requisitions.forEach(req => {
      req.items.forEach(item => {
        if (item.issues.length > 0) {
          results.summary.needsAttention.push({
            requisition: `${req.instructor} ${req.course}`,
            ingredient: item.originalName,
            issues: item.issues,
            status: item.status
          });
        }
      });
    });

    return results;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setImportData(json);
        const validation = validateRequisitions(json);
        setValidationResults(validation);
        if (onImportComplete) {
          onImportComplete(validation, json);
        }
      } catch (error) {
        alert('Error parsing JSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!validationResults) return;
    setImporting(true);
    setTimeout(() => {
      if (onImportComplete) {
        onImportComplete(validationResults, importData);
      }
      setImporting(false);
    }, 1000);
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      ready: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Ready' },
      missing: { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: 'Missing' },
      'needs-vendor': { icon: Package, color: 'text-orange-600 bg-orange-50', label: 'Needs Vendor' },
      'needs-pricing': { icon: DollarSign, color: 'text-yellow-600 bg-yellow-50', label: 'Needs Pricing' },
      'needs-yield': { icon: TrendingUp, color: 'text-blue-600 bg-blue-50', label: 'Needs Yield%' }
    };
    const config = configs[status] || configs.missing;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import & Validate Requisitions</h1>
        <p className="text-gray-600">Upload requisitions JSON to validate ingredients</p>
      </div>
      {!validationResults && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Upload Requisitions</h2>
          </div>
          <input type="file" accept=".json" onChange={handleFileUpload} className="block w-full text-sm" />
        </div>
      )}
      {validationResults && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-2xl font-bold">{validationResults.summary.totalItems}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <div className="text-sm text-gray-600">Ready to Order</div>
              <div className="text-2xl font-bold text-green-600">{validationResults.summary.readyToOrder}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
              <div className="text-sm text-gray-600">Missing</div>
              <div className="text-2xl font-bold text-red-600">{validationResults.summary.missingIngredients}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
              <div className="text-sm text-gray-600">Needs Data</div>
              <div className="text-2xl font-bold text-orange-600">{validationResults.summary.missingVendor + validationResults.summary.missingPricing + validationResults.summary.missingYield}</div>
            </div>
          </div>
          <div className="space-y-6">
            {validationResults.requisitions.map((req, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">{req.instructor} - {req.course}</h3>
                  <p className="text-sm text-gray-600">Week {req.week} {req.dayOfWeek} | {req.items.length} items</p>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 text-sm">{item.originalName}</td>
                        <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <button onClick={executeImport} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">
            {importing ? 'Importing...' : 'Import Requisitions'}
          </button>
        </>
      )}
    </div>
  );
};

export default ImportRequisitions;
