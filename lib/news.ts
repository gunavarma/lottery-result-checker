export interface NewsArticle {
  id: string;
  slug: string;
  category: 'Bumper Lotteries' | 'Scheme Updates' | 'Claim Rules' | 'Draw Analysis';
  title: string;
  subtitle: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  readTime: string;
  relatedLotterySlug?: string;
  relatedLotteryName?: string;
  featured?: boolean;
  content: string[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'thiruvonam-bumper-2026-announcement',
    slug: 'thiruvonam-bumper-2026-prize-structure-draw-details',
    category: 'Bumper Lotteries',
    title: 'Thiruvonam Bumper 2026: Official Prize Structure, Series & Release Timetable',
    subtitle: 'The Directorate of Kerala State Lotteries confirms the highest first prize of INR 25 Crore with 20 second prize winners of INR 1 Crore each.',
    excerpt: 'Detailed analysis of the upcoming Thiruvonam Bumper draw, total prize outlay, ticket series distribution, and official draw guidelines.',
    publishedAt: '2026-08-25',
    author: 'Editorial Desk',
    readTime: '4 min read',
    relatedLotterySlug: 'thiruvonam-bumper',
    relatedLotteryName: 'Thiruvonam Bumper',
    featured: true,
    content: [
      'The Directorate of Kerala State Lotteries has officially announced the complete structure and prize allocation schedule for the upcoming Thiruvonam Bumper draw. Renowned as India’s highest-prize state-administered lottery, the 2026 edition continues the historic first prize benchmark of INR 25 Crore.',
      'A notable highlight in this year’s release is the broad distribution across intermediate prize tiers. Beyond the top jackpot, twenty individual winners will each receive a second prize of INR 1 Crore across distinct ticket series, alongside twenty third-prize winners of INR 50 Lakhs.',
      'According to official department releases, tickets are printed with high-security features including micro-lettering, invisible fluorescent ink patterns, and cryptographic QR tracking to prevent counterfeiting and safeguard ticket holders.',
      'Draw proceedings will take place at Gorky Bhavan, Thiruvananthapuram under the direct supervision of the appointed judging panel and public observers. As with all Kerala State Lotteries, official result gazettes will be published on the LOTIS portal immediately following the draw.',
      'Winners are reminded that claim documentation for prizes exceeding INR 1 Lakh must be presented to the Directorate of State Lotteries or designated nationalized banks within 90 days from the date of the draw.'
    ]
  },
  {
    id: 'guide-to-claiming-kerala-lottery-prizes',
    slug: 'official-guide-how-to-claim-kerala-lottery-prize-money',
    category: 'Claim Rules',
    title: 'Complete Guide: How to Verify and Claim Kerala Lottery Prize Money',
    subtitle: 'Step-by-step procedures for claiming prizes below INR 1 Lakh, above INR 1 Lakh, and required tax deductions under Section 194B.',
    excerpt: 'An authoritative walkthrough of the verification workflow, required documents, bank procedures, and income tax guidelines for winning tickets.',
    publishedAt: '2026-08-22',
    author: 'Legal & Compliance Bureau',
    readTime: '5 min read',
    featured: false,
    content: [
      'Claiming a winning ticket from the Kerala State Lottery requires strict adherence to the statutory guidelines framed by the Government of Kerala. Depending on the prize amount, the claim submission venue and documentation requirements vary.',
      'Prizes up to INR 5,000 can be redeemed directly from any authorized lottery retailer across Kerala upon physical verification of the ticket.',
      'For prizes between INR 5,000 and INR 1 Lakh, claimants must submit the original ticket along with government-issued photo identification (such as Aadhaar, Passport, or PAN card) to the respective District Lottery Office.',
      'For prizes exceeding INR 1 Lakh, the original winning ticket must be submitted directly to the Directorate of State Lotteries in Thiruvananthapuram or through a nationalized bank. The ticket must be signed on the reverse with the claimant’s full name, address, and signature.',
      'Tax Deductions: In accordance with Section 194B of the Income Tax Act, prizes exceeding INR 10,000 are subject to a mandatory 30% Tax Deducted at Source (TDS) prior to disbursement, along with applicable surcharges and cess.'
    ]
  },
  {
    id: 'suvarna-keralam-scheme-revision',
    slug: 'suvarna-keralam-lottery-draw-schedule-and-rules',
    category: 'Scheme Updates',
    title: 'Suvarna Keralam Friday Draw: Structure, Ticket Prices & Probability Breakdown',
    subtitle: 'Overview of the popular weekly Friday draw offering a top prize of INR 1 Crore with enhanced lower-tier payout frequency.',
    excerpt: 'Detailed breakdown of the Suvarna Keralam scheme, prize tiers from first prize to eighth prize, and verification procedures.',
    publishedAt: '2026-08-20',
    author: 'Data & Analytics Team',
    readTime: '3 min read',
    relatedLotterySlug: 'suvarna-keralam',
    relatedLotteryName: 'Suvarna Keralam',
    featured: false,
    content: [
      'The Suvarna Keralam lottery, conducted every Friday at 3:00 PM IST, remains one of the most widely subscribed weekly schemes in the state. Priced at INR 40 per ticket, the scheme provides a balanced prize distribution designed to award both top-tier jackpots and widespread consolation prizes.',
      'The draw features 12 ticket series: VA, VB, VC, VD, VE, VF, VG, VH, VJ, VK, VL, and VM. While the first prize winner secures INR 1 Crore, the remaining 11 matching series numbers receive a consolation prize of INR 8,000 each.',
      'Subsequent tiers include a 2nd Prize of INR 30 Lakhs, a 3rd Prize of INR 5 Lakhs, followed by 4th through 8th prize tiers that award winning tickets based on the last four digits.',
      'Real-time results for Suvarna Keralam are published every Friday at 3:00 PM IST and fully synchronized on this platform within minutes of the official LOTIS release.'
    ]
  },
  {
    id: 'kerala-lottery-security-measures',
    slug: 'how-to-identify-genuine-kerala-state-lottery-tickets',
    category: 'Claim Rules',
    title: 'Security Features: How to Identify Genuine Kerala State Lottery Tickets',
    subtitle: 'Key visual markers, security guilloche patterns, barcode specifications, and how to protect against unauthorized paper duplicates.',
    excerpt: 'A comprehensive checklist for lottery buyers to verify paper ticket authenticity and avoid fraudulent reproductions.',
    publishedAt: '2026-08-16',
    author: 'Security & Verification Desk',
    readTime: '4 min read',
    featured: false,
    content: [
      'All official Kerala State Lottery tickets are printed with state-of-the-art security features at the government press to eliminate reproduction and protect buyers.',
      '1. Paper Quality & Watermark: Official tickets use specialized currency-grade paper with an embedded watermark visible when held up to light.',
      '2. Micro-Printing & Border Guilloche: The intricate borders around the draw number and serial codes contain microscopic text that cannot be duplicated by standard commercial digital printers.',
      '3. Serial & Barcode Verification: Every ticket carries a unique multi-digit barcode paired with a serial number registered in the centralized Directorate database.',
      '4. Draw Date & Seal: Confirm that the date of the draw, scheme code, and official emblem of the Government of Kerala are cleanly printed without misalignment or smudging.'
    ]
  }
];

export function getAllNews(): NewsArticle[] {
  return NEWS_ARTICLES;
}

export function getFeaturedNews(): NewsArticle {
  return NEWS_ARTICLES.find(a => a.featured) || NEWS_ARTICLES[0];
}

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find(a => a.slug === slug);
}

export function getNewsByCategory(category: string): NewsArticle[] {
  return NEWS_ARTICLES.filter(a => a.category.toLowerCase() === category.toLowerCase());
}

export function getRelatedNewsForLottery(lotterySlug: string): NewsArticle[] {
  return NEWS_ARTICLES.filter(a => a.relatedLotterySlug === lotterySlug || !a.relatedLotterySlug).slice(0, 3);
}
