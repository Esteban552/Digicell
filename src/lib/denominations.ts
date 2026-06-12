export interface Denom {
  value: number;
  label: string;
  type: 'bill' | 'coin';
}

export const DENOMS: Denom[] = [
  { value: 1000, label: '$1,000', type: 'bill' },
  { value: 500,  label: '$500',   type: 'bill' },
  { value: 200,  label: '$200',   type: 'bill' },
  { value: 100,  label: '$100',   type: 'bill' },
  { value: 50,   label: '$50',    type: 'bill' },
  { value: 20,   label: '$20',    type: 'bill' },
  { value: 10,   label: '$10',    type: 'coin' },
  { value: 5,    label: '$5',     type: 'coin' },
  { value: 2,    label: '$2',     type: 'coin' },
  { value: 1,    label: '$1',     type: 'coin' },
];

export type DenomCounts = Record<number, number>;

export function emptyCounts(): DenomCounts {
  return Object.fromEntries(DENOMS.map(d => [d.value, 0]));
}

export function calcTotal(counts: DenomCounts): number {
  return DENOMS.reduce((s, d) => s + d.value * (counts[d.value] || 0), 0);
}

export interface ChangeResult {
  change: number;
  short: number;
}

export function calcChange(received: number, due: number): ChangeResult {
  if (received >= due) return { change: received - due, short: 0 };
  return { change: 0, short: due - received };
}

export function countsToParts(counts: DenomCounts): string {
  return DENOMS
    .filter(d => (counts[d.value] || 0) > 0)
    .map(d => `${counts[d.value]}× ${d.label}`)
    .join(', ');
}

export function addCounts(a: DenomCounts, b: DenomCounts): DenomCounts {
  const r = { ...a };
  for (const d of DENOMS) {
    r[d.value] = (r[d.value] || 0) + (b[d.value] || 0);
  }
  return r;
}

export function subCounts(a: DenomCounts, b: DenomCounts): DenomCounts {
  const r = { ...a };
  for (const d of DENOMS) {
    r[d.value] = Math.max(0, (r[d.value] || 0) - (b[d.value] || 0));
  }
  return r;
}
