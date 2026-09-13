import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { checkTicketsHandler } from '../app/api/tickets/check/route';
import { prisma } from '../lib/prisma';

const projectRoot = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(projectRoot, rel), 'utf8');

describe('Camera Permissions-Policy', () => {
  it('allows the site itself to use the camera', () => {
    const config = read('next.config.ts');
    const policy = config.match(/value:\s*'([^']*camera=[^']*)'/)?.[1] ?? '';

    expect(policy).toContain('camera=(self)');
    // An empty allowlist, `camera=()`, disables the camera for our own origin
    // too and made every getUserMedia() call fail before any prompt appeared.
    expect(policy).not.toMatch(/camera=\(\)/);
  });

  it('still denies microphone and geolocation', () => {
    const config = read('next.config.ts');
    expect(config).toContain('microphone=()');
    expect(config).toContain('geolocation=()');
  });
});

describe('Ticket check result buckets', () => {
  it('reports NOT_FOUND (never NO_MATCH) when no published result exists', async () => {
    vi.spyOn(prisma.draw, 'findMany').mockResolvedValueOnce([]);

    const result = await checkTicketsHandler({ tickets: ['SK 320327', '1234'] });

    expect(result.success).toBe(true);
    expect(result.drawFound).toBe(false);
    expect(result.drawsEvaluated).toEqual([]);

    for (const entry of result.results as any[]) {
      expect(entry.status).toBe('NOT_FOUND');
      // A missing result must never be presented as a loss.
      expect(entry.isMatch).toBe(false);
      expect(entry.normalizedDisplay).toBeTruthy();
    }
  });

  it('reports NOT_FOUND for a value that is not a recognizable ticket number', async () => {
    vi.spyOn(prisma.draw, 'findMany').mockResolvedValueOnce([
      {
        id: 'd',
        drawNumber: 'SK-1',
        drawDate: new Date('2026-01-01T00:00:00.000Z'),
        lottery: { name: 'Suvarna Keralam', slug: 'suvarna-keralam' },
        prizes: [{ category: '1st Prize', amount: 1, orderIndex: 0, winningNumbers: [] }],
      } as any,
    ]);

    const result = await checkTicketsHandler({ tickets: ['abcdefgh'] });
    const entry = result.results[0] as any;
    expect(entry.status).toBe('NOT_FOUND');
    expect(entry.isMatch).toBe(false);
  });

  it('still reports NO_MATCH when a real result was checked and did not win', async () => {
    vi.spyOn(prisma.draw, 'findMany').mockResolvedValueOnce([
      {
        id: 'd2',
        drawNumber: 'SK-2',
        drawDate: new Date('2026-01-02T00:00:00.000Z'),
        sourceUrl: 'https://example.test/r',
        lottery: { name: 'Suvarna Keralam', slug: 'suvarna-keralam' },
        prizes: [
          {
            category: '1st Prize',
            amount: 10000000,
            orderIndex: 0,
            winningNumbers: [
              { series: 'SK', number: '320327', displayNumber: 'SK 320327', location: null },
            ],
          },
        ],
      } as any,
    ]);

    const result = await checkTicketsHandler({ tickets: ['SK 999999'] });
    const entry = result.results[0] as any;
    expect(entry.status).toBe('NO_MATCH');
    expect(entry.isMatch).toBe(false);
  });
});

describe('Photo scanning (html5-qrcode scanFile)', () => {
  it('always mounts a decode container outside the tab panels', () => {
    const scanner = read('components/lottery/TicketScanner.tsx');

    // scanFile() looks the element up by id and dereferences it with no null
    // check, so it must exist whenever a photo can be uploaded — not only while
    // the camera tab happens to be mounted.
    expect(scanner).toContain('fileScanContainerId');
    expect(scanner).toMatch(/id=\{fileScanContainerId\}/);
  });

  it('uses a dedicated instance for file decoding instead of the camera instance', () => {
    const scanner = read('components/lottery/TicketScanner.tsx');

    expect(scanner).toContain('fileScannerRef');
    expect(scanner).toContain('getFileScanner');
    // html5-qrcode refuses to scan a file while the same instance is scanning a
    // camera stream ("ongoing camera scan"), so the upload path must not reuse
    // the camera instance.
    expect(scanner).toMatch(/getFileScanner\(\)\.scanFile\(/);
    expect(scanner).not.toMatch(/scannerRef\.current\s*\|\|\s*new Html5Qrcode/);
  });

  it('falls back to OCR when a photo contains no readable barcode', () => {
    const scanner = read('components/lottery/TicketScanner.tsx');
    expect(scanner).toContain('parseKeralaLotteryTicketOcr');
    // Tesseract must stay lazily imported so its weight never reaches the
    // main bundle.
    expect(scanner).toMatch(/await import\('tesseract\.js'\)/);
    expect(scanner).not.toMatch(/^import .*from 'tesseract\.js'/m);
  });

  it('stopped shipping the duplicate scanner implementation', () => {
    expect(fs.existsSync(path.join(projectRoot, 'components/TicketScannerModal.tsx'))).toBe(false);
    // The OCR module it used to own is still in use by the live scanner.
    expect(fs.existsSync(path.join(projectRoot, 'lib/ocr/ticket-ocr.ts'))).toBe(true);
  });
});
