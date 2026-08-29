import { describe, it, expect } from 'vitest';
import { VERIFIED_INITIAL_NEWS } from '../lib/news/news-engine';
import { parseLotisTableHtml } from '../lib/lotis/sync';

describe('Automated Ingestion & News System', () => {
  it('parses LOTIS table rows accurately with irregular HTML whitespace', () => {
    const sampleHtml = `
      <table id="example">
        <tbody>
          <td>1</td>
          <td>KARUNYA PLUS-10/11/2025 (KN-638)</td>
          <td>27-08-2026</td>
          <td><a href="#" data-item-id="bd338e1c-7f7f-87ad-9b10-273ee368336e">Download</a></td>
          </tr>
          <td>2</td>
          <td>SUVARNA KERALAM (SK-67)</td>
          <td>28-08-2026</td>
          <td><a href="#" data-item-id="7ea9b2a7-58f3-57b4-a330-1a7b40780ef8">Download</a></td>
          </tr>
        </tbody>
      </table>
    `;

    const items = parseLotisTableHtml(sampleHtml);
    expect(items.length).toBe(2);
    expect(items[0].drawNumber).toBe('KN-638');
    expect(items[0].lotteryName).toBe('Karunya Plus');
    expect(items[0].itemId).toBe('bd338e1c-7f7f-87ad-9b10-273ee368336e');
    expect(items[1].drawNumber).toBe('SK-67');
    expect(items[1].lotteryName).toBe('Suvarna Keralam');
  });

  it('validates verified news articles contain required attribution and categories', () => {
    expect(VERIFIED_INITIAL_NEWS.length).toBeGreaterThan(0);

    for (const article of VERIFIED_INITIAL_NEWS) {
      expect(article.slug).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.categorySlug).toBeDefined();
      expect(article.sourceName).toBeDefined();
      expect(article.canonicalUrl).toMatch(/^https?:\/\//);
      expect(article.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it('verifies historical import cursor arithmetic for resumable jobs', () => {
    const totalItems = 100;
    const batchSize = 25;

    let cursor = 0;
    const processBatch = (currentCursor: number) => {
      const start = currentCursor;
      const end = Math.min(start + batchSize, totalItems);
      const isComplete = end >= totalItems;
      return { nextCursor: end, isComplete };
    };

    const batch1 = processBatch(cursor);
    expect(batch1.nextCursor).toBe(25);
    expect(batch1.isComplete).toBe(false);

    cursor = batch1.nextCursor;
    const batch2 = processBatch(cursor);
    expect(batch2.nextCursor).toBe(50);
    expect(batch2.isComplete).toBe(false);

    cursor = 75;
    const batch4 = processBatch(cursor);
    expect(batch4.nextCursor).toBe(100);
    expect(batch4.isComplete).toBe(true);
  });
});
