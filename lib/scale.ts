/**
 * Scales a human-written amount ("2 tbsp", "1/2 cup", "400 g", "to taste")
 * by a factor, keeping the unit text. Non-numeric amounts are returned as-is.
 */
const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function parseLeadingNumber(amount: string): { value: number; rest: string } | null {
  const trimmed = amount.trim();
  const unicode = trimmed.match(/^(\d+)?\s*([½¼¾⅓⅔])\s*(.*)$/);
  if (unicode) {
    const whole = unicode[1] ? Number(unicode[1]) : 0;
    return { value: whole + FRACTIONS[unicode[2]], rest: unicode[3] };
  }
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixed) {
    return { value: Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]), rest: mixed[4] };
  }
  const fraction = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fraction) {
    return { value: Number(fraction[1]) / Number(fraction[2]), rest: fraction[3] };
  }
  const decimal = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (decimal) {
    return { value: Number(decimal[1].replace(',', '.')), rest: decimal[2] };
  }
  return null;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const quarters = Math.round(value * 4) / 4;
  const whole = Math.floor(quarters);
  const frac = quarters - whole;
  const glyph = frac === 0.25 ? '¼' : frac === 0.5 ? '½' : frac === 0.75 ? '¾' : '';
  if (glyph) return whole > 0 ? `${whole}${glyph}` : glyph;
  return (Math.round(value * 10) / 10).toString();
}

export function scaleAmount(amount: string, factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return amount;
  const parsed = parseLeadingNumber(amount);
  if (!parsed || parsed.value <= 0) return amount;
  const scaled = parsed.value * factor;
  return `${formatNumber(scaled)}${parsed.rest ? ` ${parsed.rest}` : ''}`;
}
