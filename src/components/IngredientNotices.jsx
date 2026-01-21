/**
 * IngredientNotices Component
 * Displays substitution/make-in-house notices for instructor confirmations
 */

import React from 'react';

const noticeStyles = {
  substitute: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: '🔄',
    title: 'Substitution'
  },
  use_fresh: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: '🍋',
    title: 'Fresh Ingredient'
  },
  make_in_house: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: '👨‍🍳',
    title: 'Made In-House'
  },
  unavailable: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '❌',
    title: 'Unavailable'
  }
};

function NoticeCard({ flag }) {
  const style = noticeStyles[flag.type] || noticeStyles.substitute;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-3 mb-2`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{style.icon}</span>
        <div className="flex-1">
          <div className="font-medium text-gray-800">
            {flag.original}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {flag.message}
          </div>
          
          {/* Show sub-recipe ingredients */}
          {flag.type === 'make_in_house' && flag.ingredients && (
            <div className="mt-2 text-xs text-gray-500">
              <div className="font-medium">Recipe: {flag.recipe} ({flag.source})</div>
              <div className="mt-1 pl-2 border-l-2 border-gray-300">
                {flag.ingredients.map((ing, idx) => (
                  <div key={idx}>
                    {ing.amount} {ing.unit} {ing.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function IngredientNotices({ flags }) {
  if (!flags || flags.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <span>📋</span>
        Ingredient Notes ({flags.length})
      </h4>
      {flags.map((flag, idx) => (
        <NoticeCard key={idx} flag={flag} />
      ))}
    </div>
  );
}

/**
 * Compact version for requisition lists
 */
export function IngredientNoticesBadge({ flags }) {
  if (!flags || flags.length === 0) {
    return null;
  }

  const counts = {
    substitute: flags.filter(f => f.type === 'substitute').length,
    use_fresh: flags.filter(f => f.type === 'use_fresh').length,
    make_in_house: flags.filter(f => f.type === 'make_in_house').length,
    unavailable: flags.filter(f => f.type === 'unavailable').length
  };

  return (
    <div className="flex gap-1">
      {counts.substitute > 0 && (
        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full" title="Substitutions">
          🔄 {counts.substitute}
        </span>
      )}
      {counts.use_fresh > 0 && (
        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full" title="Fresh citrus">
          🍋 {counts.use_fresh}
        </span>
      )}
      {counts.make_in_house > 0 && (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full" title="Made in-house">
          👨‍🍳 {counts.make_in_house}
        </span>
      )}
      {counts.unavailable > 0 && (
        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full" title="Unavailable">
          ❌ {counts.unavailable}
        </span>
      )}
    </div>
  );
}

/**
 * Generate plain text version for emails/exports
 */
export function generateNoticesText(flags) {
  if (!flags || flags.length === 0) {
    return '';
  }

  const lines = ['INGREDIENT NOTES:', ''];

  for (const flag of flags) {
    lines.push(`• ${flag.message}`);
    
    if (flag.type === 'make_in_house' && flag.ingredients) {
      lines.push(`  Recipe: ${flag.recipe} (${flag.source})`);
      lines.push('  Ingredients added:');
      flag.ingredients.forEach(ing => {
        lines.push(`    - ${ing.amount} ${ing.unit} ${ing.name}`);
      });
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default IngredientNotices;
