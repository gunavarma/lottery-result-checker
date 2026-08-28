import { describe, it, expect } from 'vitest';

describe('Duplicate Draw Detection Logic', () => {
  it('identifies identical draw items by drawNumber and sourceItemId', () => {
    const existingDraws = [
      { drawNumber: 'KN-638', sourceItemId: 'bd338e1c-7f7f-87ad-9b10-273ee368336e' },
      { drawNumber: 'SS-534', sourceItemId: '92f31795-f14b-142d-782a-1ca1286cdca1' },
    ];

    const isDuplicate = (incomingDrawNumber: string, incomingItemId: string) => {
      return existingDraws.some(
        (d) => d.drawNumber === incomingDrawNumber || d.sourceItemId === incomingItemId
      );
    };

    expect(isDuplicate('KN-638', 'new-uuid')).toBe(true);
    expect(isDuplicate('NEW-100', 'bd338e1c-7f7f-87ad-9b10-273ee368336e')).toBe(true);
    expect(isDuplicate('SK-67', 'another-uuid')).toBe(false);
  });
});
