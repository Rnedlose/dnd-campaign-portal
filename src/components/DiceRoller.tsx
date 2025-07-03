import { useState, useEffect } from 'react';

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

function getFormulaString(diceCounts: Record<number, number>, modifier: number) {
  const parts = [];
  for (const die of DICE_TYPES) {
    if (diceCounts[die]) {
      parts.push(`${diceCounts[die]}d${die}`);
    }
  }
  let formula = parts.join(' + ');
  if (modifier > 0) formula += (formula ? ' + ' : '') + modifier;
  if (modifier < 0) formula += (formula ? ' - ' : '-') + Math.abs(modifier);
  return formula;
}

export function DiceRoller({ onFormulaChange, reset }: { onFormulaChange: (formula: string) => void, reset: number }) {
  const [diceCounts, setDiceCounts] = useState<Record<number, number>>({});
  const [modifier, setModifier] = useState(0);

  useEffect(() => {
    setDiceCounts({});
    setModifier(0);
    onFormulaChange('');
  }, [reset, onFormulaChange]);

  const updateFormula = (nextDiceCounts: Record<number, number>, nextModifier: number) => {
    const formula = getFormulaString(nextDiceCounts, nextModifier);
    onFormulaChange(formula);
  };

  const handleAddDie = (die: number) => {
    const next = { ...diceCounts, [die]: (diceCounts[die] || 0) + 1 };
    setDiceCounts(next);
    updateFormula(next, modifier);
  };

  const handleModifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setModifier(value);
    updateFormula(diceCounts, value);
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col gap-2">
      <div className="flex items-center gap-2 justify-center mb-2">
        {DICE_TYPES.map((die) => (
          <button
            key={die}
            onClick={() => handleAddDie(die)}
            className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-600 flex items-center justify-center text-xs font-bold border border-gray-300 dark:border-gray-700"
            title={`Add d${die}`}
            style={{ fontSize: '0.85rem' }}
          >
            d{die}
          </button>
        ))}
        <input
          type="number"
          value={modifier}
          onChange={handleModifierChange}
          className="w-16 ml-2 rounded p-1 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-center"
          placeholder="Mod"
        />
      </div>
    </div>
  );
} 