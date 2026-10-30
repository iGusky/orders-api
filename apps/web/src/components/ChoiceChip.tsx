import type { ReactNode } from 'react';

interface ChoiceChipProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

export function ChoiceChip({ selected, onSelect, children }: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`flex min-h-touch items-center gap-2 rounded-full border px-4 font-semibold ${selected ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface active:bg-primary-soft'}`}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
