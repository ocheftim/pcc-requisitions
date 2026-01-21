import React from 'react';
import { UNIT_CATEGORIES } from '../../constants/units';
const UnitSelector = ({ value, onChange, disabled = false, className = '' }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}
    className={`border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100' : 'bg-white'} ${className}`}>
    <option value="">Unit</option>
    {Object.entries(UNIT_CATEGORIES).map(([k, c]) => (
      <optgroup key={k} label={c.label}>{c.units.map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
    ))}
  </select>
);
export default UnitSelector;
