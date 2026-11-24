import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractSchemeAndCode,
  getDailyFallbackVideos,
  parseYouTubeSearchData,
  getDailyKeralaLotteryVideos,
  clearYouTubeVideoCache,
} from '../lib/news/youtube-news';

describe('YouTube Daily Lottery Video News', () => {
  beforeEach(() => {
    clearYouTubeVideoCache();
  });

  describe('extractSchemeAndCode', () => {
    it('identifies standard weekly schemes and draw codes', () => {
      const suvarna = extractSchemeAndCode('KERALA LOTTERY SUVARNA KERALAM SK-77 LIVE RESULT');
      expect(suvarna.schemeName).toBe('Suvarna Keralam');
      expect(suvarna.drawCode).toBe('SK-77');

      const karunyaPlus = extractSchemeAndCode('KARUNYA PLUS KN-649 LOTTERY RESULT 12/11/2026');
      expect(karunyaPlus.schemeName).toBe('Karunya Plus');
      expect(karunyaPlus.drawCode).toBe('KN-649');

      const fiftyFifty = extractSchemeAndCode('FIFTY FIFTY FF-116 TODAY DRAW OFFICIAL');
      expect(fiftyFifty.schemeName).toBe('Fifty-Fifty');
      expect(fiftyFifty.drawCode).toBe('FF-116');

      const sthreeSakthi = extractSchemeAndCode('STHREE SAKTHI SS-400 WINNING NUMBERS');
      expect(sthreeSakthi.schemeName).toBe('Sthree Sakthi');
      expect(sthreeSakthi.drawCode).toBe('SS-400');

      const winWin = extractSchemeAndCode('WIN-WIN W-780 DRAW ANNOUNCEMENT');
      expect(winWin.schemeName).toBe('Win-Win');
      expect(winWin.drawCode).toBe('W-780');

      const thiruvonam = extractSchemeAndCode('THIRUVONAM BUMPER BR-99 25 CRORE FIRST PRIZE');
      expect(thiruvonam.schemeName).toBe('Thiruvonam Bumper');
      expect(thiruvonam.drawCode).toBe('BR-99');
    });

    it('falls back to generic title when scheme is not named', () => {
      const generic = extractSchemeAndCode('TODAY KERALA DRAW LIVE BULLETIN');
      expect(generic.schemeName).toBe('Kerala State Lottery');
      expect(generic.drawCode).toBeUndefined();
    });
  });

  describe('getDailyFallbackVideos', () => {
    it('produces verified, well-formed video records with YouTube URLs', () => {
      const videos = getDailyFallbackVideos(new Date('2026-11-13T10:00:00Z')); // Friday -> Suvarna Keralam
      expect(videos.length).toBeGreaterThanOrEqual(4);

      const top = videos[0];
      expect(top.id).toBeDefined();
      expect(top.title).toContain('SUVARNA KERALAM');
      expect(top.url).toBe(`https://www.youtube.com/watch?v=${top.id}`);
      expect(top.embedUrl).toBe(`https://www.youtube.com/embed/${top.id}`);
      expect(top.thumbnailUrl).toContain(top.id);
      expect(top.channelTitle).toBeDefined();
    });

    it('adapts to Monday draw (Bhagya Thara / Win-Win)', () => {
      const mondayVideos = getDailyFallbackVideos(new Date('2026-11-09T10:00:00Z')); // Monday
      expect(mondayVideos[0].schemeName).toBe('Bhagya Thara');
    });
  });

  describe('parseYouTubeSearchData', () => {
    it('extracts video items from mocked ytInitialData HTML', () => {
      const mockInitialData = {
        contents: {
          twoColumnSearchResultsRenderer: {
            primaryContents: {
              sectionListRenderer: {
                contents: [
                  {
                    itemSectionRenderer: {
                      contents: [
                        {
                          videoRenderer: {
                            videoId: 'mock_vid_123',
                            title: {
                              runs: [{ text: 'KERALA LOTTERY NIRMAL NR-350 LIVE TODAY' }],
                            },
                            ownerText: {
                              runs: [
                                {
                                  text: 'Kerala State Lottery Official',
                                  navigationEndpoint: {
                                    commandMetadata: {
                                      webCommandMetadata: { url: '/@OfficialLottery' },
                                    },
                                  },
                                },
                              ],
                            },
                            publishedTimeText: { simpleText: '2 hours ago' },
                            badges: [
                              {
                                metadataBadgeRenderer: { label: 'LIVE' },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const html = `<html><script>var ytInitialData = ${JSON.stringify(mockInitialData)};</script></html>`;
      const result = parseYouTubeSearchData(html);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('mock_vid_123');
      expect(result[0].title).toBe('KERALA LOTTERY NIRMAL NR-350 LIVE TODAY');
      expect(result[0].schemeName).toBe('Nirmal');
      expect(result[0].drawCode).toBe('NR-350');
      expect(result[0].isLive).toBe(true);
      expect(result[0].channelTitle).toBe('Kerala State Lottery Official');
      expect(result[0].channelUrl).toBe('https://www.youtube.com/@OfficialLottery');
    });

    it('returns empty array when HTML lacks ytInitialData', () => {
      expect(parseYouTubeSearchData('<html><body>No data</body></html>')).toEqual([]);
    });
  });

  describe('getDailyKeralaLotteryVideos', () => {
    it('returns daily videos and caches the result', async () => {
      const firstCall = await getDailyKeralaLotteryVideos();
      expect(firstCall.length).toBeGreaterThan(0);

      const secondCall = await getDailyKeralaLotteryVideos();
      expect(secondCall).toBe(firstCall); // Same cached reference
    });
  });
});
