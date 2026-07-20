import { truncateForDisplay } from "../../lib/utils";

// Chips render short enough that the same cost/layout concern MessageBubble
// guards against barely applies here — a much tighter cap than the message
// bubble's, since a legitimate suggested action is always a few words.
const MAX_CHIP_DISPLAY_LENGTH = 200;

export function ChipRow({
  chips,
  onSelect,
  disabled,
}: {
  chips: string[];
  onSelect: (text: string) => void;
  disabled: boolean;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="bg-parchment px-4 pb-3">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(chip)}
            className="max-w-full whitespace-normal break-words rounded-full bg-parchment-3 px-3 py-1.5 text-left text-xs font-medium text-sage-dark transition-colors hover:bg-parchment-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
          >
            {truncateForDisplay(chip, MAX_CHIP_DISPLAY_LENGTH)}
          </button>
        ))}
      </div>
    </div>
  );
}
