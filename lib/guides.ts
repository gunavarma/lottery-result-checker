export interface GuideArticle {
  id: string;
  slug: string;
  category: 'Verification' | 'Rules & Claims' | 'Draw Process' | 'Tools & Alerts';
  title: string;
  subtitle: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  readTime: string;
  relatedLotterySlug?: string;
  relatedLotteryName?: string;
  featured?: boolean;
  tableOfContents: { id: string; title: string }[];
  sections: {
    id: string;
    title: string;
    paragraphs: string[];
    tips?: string[];
  }[];
  faqs: { question: string; answer: string }[];
}

export const GUIDES: GuideArticle[] = [
  {
    id: 'how-to-check-kerala-lottery-ticket',
    slug: 'how-to-check-kerala-lottery-ticket',
    category: 'Tools & Alerts',
    title: 'How to Check Kerala Lottery Ticket Numbers Accurately',
    subtitle: 'Step-by-step instructions for checking 2-letter series codes, 6-digit jackpot numbers, consolation series, and 4-digit lower-tier ending digits.',
    excerpt: 'Learn the exact method to verify physical Kerala Lottery paper tickets against official published LOTIS result gazettes without missing consolation or lower prize tiers.',
    publishedAt: '2026-08-20',
    updatedAt: '2026-08-28',
    author: 'KeralaDraws Verification Desk',
    readTime: '5 min read',
    featured: true,
    tableOfContents: [
      { id: 'anatomy-of-ticket', title: 'Anatomy of a Kerala Lottery Ticket' },
      { id: 'checking-1st-prize', title: 'Checking 1st Prize & Consolation Series' },
      { id: 'checking-lower-tiers', title: 'Checking 2nd to 8th Prize Ending Digits' },
      { id: 'using-ticket-checker', title: 'Using the KeralaDraws Instant Ticket Checker' },
      { id: 'verification-safety', title: 'Statutory Verification Safety Rules' },
    ],
    sections: [
      {
        id: 'anatomy-of-ticket',
        title: 'Anatomy of a Kerala Lottery Ticket',
        paragraphs: [
          'Every physical Kerala State Lottery ticket features a specific combination of alphanumeric codes printed on currency-grade paper. Understanding these components is essential before checking your ticket.',
          'The first two letters represent the Ticket Series (for example, VA, VB, VC, PN, PS, or KN). The following six digits represent the unique Ticket Number (for example, 320327). In addition, the top banner prints the Draw Name (such as Suvarna Keralam or Karunya Plus) and the official Draw Number (such as SK-67 or KN-638).',
        ],
        tips: [
          'Ensure the draw date and lottery scheme name on your paper ticket match the exact result draw you are evaluating.',
        ],
      },
      {
        id: 'checking-1st-prize',
        title: 'Checking 1st Prize & Consolation Series',
        paragraphs: [
          'The First Prize requires an exact match of both the series code and the entire 6-digit number. For example, if the certified 1st prize is PS 320327, only a ticket bearing the PS series and 320327 wins the top jackpot.',
          'Consolation Prizes: If your ticket has the exact same 6 digits (320327) but belongs to any of the other 11 printed series for that draw (e.g., PN 320327, PO 320327, PR 320327), you win the statutory Consolation Prize (typically INR 8,000 per ticket). Many participants mistakenly discard consolation-winning tickets, so always check the 6-digit number even if the series letters differ.',
        ],
      },
      {
        id: 'checking-lower-tiers',
        title: 'Checking 2nd to 8th Prize Ending Digits',
        paragraphs: [
          'For 2nd and 3rd prizes in certain weekly schemes, full 6-digit numbers with series are drawn. For 4th through 8th prize categories, winning numbers are awarded based on Ending Digits (last 4 digits, last 3 digits, or last 2 digits).',
          'For example, if the 7th prize lists ending numbers such as 1234, 5678, and 9012, any ticket whose last 4 digits match any of those combinations wins the prize, regardless of the series letters or the first two digits.',
        ],
      },
      {
        id: 'using-ticket-checker',
        title: 'Using the KeralaDraws Instant Ticket Checker',
        paragraphs: [
          'To avoid human oversight when scanning hundreds of 4-digit numbers, use the automated KeralaDraws Ticket Checker tool. Select your lottery scheme and enter your 6-digit ticket number (or enter multiple tickets in bulk mode).',
          'The matching algorithm automatically checks your ticket against 1st prize, consolation series, and all lower ending digit tiers simultaneously, highlighting the exact prize tier and amount won.',
        ],
      },
      {
        id: 'verification-safety',
        title: 'Statutory Verification Safety Rules',
        paragraphs: [
          'Always preserve winning tickets in clean, dry condition without cuts, tears, or overwriting. Cross-verify results with the published Kerala Government Gazette before surrendering tickets to claim counters.',
          'Prizes up to INR 5,000 can be redeemed directly from authorized retailers across Kerala. Higher amounts require submission to District Lottery Offices or the Directorate of State Lotteries in Thiruvananthapuram within 90 days of the draw.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What happens if my ticket matches the 6-digit number but has a different series code?',
        answer: 'You win the Consolation Prize (typically INR 8,000 for weekly schemes). The consolation prize is awarded to all remaining series matching the first prize 6-digit number.',
      },
      {
        question: 'Can I check multiple Kerala lottery tickets at once?',
        answer: 'Yes, the KeralaDraws Ticket Checker features a Bulk Check mode where you can paste or type multiple ticket numbers separated by commas or new lines for instant multi-tier evaluation.',
      },
      {
        question: 'What is the time limit to claim prize money for a winning ticket?',
        answer: 'Under Kerala State Lottery rules, winning tickets must be surrendered within 90 days from the date of the draw.',
      },
    ],
  },
  {
    id: 'how-kerala-lottery-results-work',
    slug: 'how-kerala-lottery-results-work',
    category: 'Draw Process',
    title: 'How Kerala State Lottery Draws Work: Proceedings & Certification',
    subtitle: 'A complete overview of the transparent mechanical drum drawing process, the government-appointed judging panel, and LOTIS gazette certification.',
    excerpt: 'Understand how official Kerala Lottery draws are conducted at Gorky Bhavan, Thiruvananthapuram, how random mechanical drums work, and how official gazette results are certified.',
    publishedAt: '2026-08-18',
    updatedAt: '2026-08-27',
    author: 'KeralaDraws Editorial Desk',
    readTime: '6 min read',
    tableOfContents: [
      { id: 'history-and-legal-status', title: 'History & Statutory Foundation' },
      { id: 'venue-and-schedule', title: 'Draw Venue & Timetable' },
      { id: 'mechanical-draw-process', title: 'Mechanical Drum Draw Process' },
      { id: 'judges-and-observers', title: 'Panel of Judges & Public Observers' },
      { id: 'lotis-gazette-publication', title: 'LOTIS Portal & Gazette Certification' },
    ],
    sections: [
      {
        id: 'history-and-legal-status',
        title: 'History & Statutory Foundation',
        paragraphs: [
          'Established in 1967 by the Government of Kerala under the Department of Finance, Kerala State Lotteries is India’s pioneer state-operated lottery system. It was created to generate non-tax revenue for state welfare schemes while offering employment opportunities to thousands of authorized lottery agents and sellers.',
          'The entire lottery ecosystem operates strictly under the provisions of the Central Lotteries (Regulation) Act, 1998 and the Kerala Paper Lotteries (Regulation) Rules.',
        ],
      },
      {
        id: 'venue-and-schedule',
        title: 'Draw Venue & Timetable',
        paragraphs: [
          'All regular weekly draws and seasonal bumper lotteries are physically held at Gorky Bhavan, near the Secretariat in Thiruvananthapuram, Kerala.',
          'Draw proceedings commence promptly at 3:00 PM IST every day. The public is permitted to witness the draw proceedings in person from the gallery, ensuring absolute transparency.',
        ],
      },
      {
        id: 'mechanical-draw-process',
        title: 'Mechanical Drum Draw Process',
        paragraphs: [
          'Unlike digital or computerized lottery systems that can be vulnerable to electronic tampering, Kerala State Lotteries utilizes purely mechanical rotating drum machines.',
          'Each rotating drum contains precision-calibrated plastic balls embossed with digits 0 through 9 (and letters for the series drums). Before the draw begins, the judges and public observers verify that the drums and balls are clean and properly calibrated.',
          'As the drums rotate at high speed, a single ball is released mechanically into the viewer tube to form each sequential digit of the winning ticket number.',
        ],
      },
      {
        id: 'judges-and-observers',
        title: 'Panel of Judges & Public Observers',
        paragraphs: [
          'Every draw is conducted under the watchful supervision of an independent panel of judges appointed by the Government of Kerala. The panel typically includes retired judicial officers, senior civil servants, and prominent citizens.',
          'Each drawn number is called out verbally, recorded on official registers, and signed by the presiding officers and judging panel immediately upon completion.',
        ],
      },
      {
        id: 'lotis-gazette-publication',
        title: 'LOTIS Portal & Gazette Certification',
        paragraphs: [
          'Following the physical draw, official results are compiled, digitally signed, and published to the Lottery Information and Management System (LOTIS) portal (`lotteryagent.kerala.gov.in`) around 4:30 PM IST.',
          'The certified PDF gazette contains the complete list of 1st, 2nd, 3rd, consolation, and lower prize ending numbers, along with official notification numbers and Directorate seals.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are Kerala Lottery draws conducted using computers or electronic software?',
        answer: 'No. Kerala State Lotteries does not use electronic software or computerized random number generators. All draws use mechanical rotating drums and physical balls under human observation.',
      },
      {
        question: 'Can the public attend Kerala lottery draws in person?',
        answer: 'Yes, members of the public are permitted to attend and witness the live draw proceedings at Gorky Bhavan, Thiruvananthapuram starting at 3:00 PM IST daily.',
      },
    ],
  },
  {
    id: 'kerala-lottery-prize-structure-explained',
    slug: 'kerala-lottery-prize-structure-explained',
    category: 'Rules & Claims',
    title: 'Kerala Lottery Prize Structure Explained: Tiers, Allocations & Payouts',
    subtitle: 'Comprehensive breakdown of how prize funds are distributed across 1st prize, consolation prizes, intermediate tiers, and lower ending digits.',
    excerpt: 'Detailed analysis of Kerala lottery prize structures, how prize money is divided across 8 tiers, consolation calculations, and tax deduction thresholds under Section 194B.',
    publishedAt: '2026-08-15',
    updatedAt: '2026-08-28',
    author: 'KeralaDraws Financial & Compliance Team',
    readTime: '5 min read',
    tableOfContents: [
      { id: 'tier-breakdown', title: 'The 8 Standard Prize Tiers' },
      { id: 'consolation-calculation', title: 'How Consolation Prizes Are Calculated' },
      { id: 'bumper-vs-weekly', title: 'Weekly Schemes vs Seasonal Bumper Allocations' },
      { id: 'tax-tds-rules', title: 'Income Tax TDS Deductions (Section 194B)' },
    ],
    sections: [
      {
        id: 'tier-breakdown',
        title: 'The 8 Standard Prize Tiers',
        paragraphs: [
          'Most weekly Kerala State Lotteries (such as Karunya Plus, Suvarna Keralam, Fifty-Fifty, and Sthree Sakthi) follow a standardized 8-tier payout structure designed to balance high top-tier payouts with broad lower-tier winner distribution.',
          '1st Prize: Ranging from INR 75 Lakhs to INR 1 Crore (or up to INR 25 Crore for Bumper draws) awarded to a single winning ticket.',
          'Consolation Prizes: Fixed statutory payouts (typically INR 8,000 each) awarded to all 11 matching series numbers sharing the first prize 6 digits.',
          '2nd & 3rd Prizes: Substantial intermediate cash payouts ranging from INR 1 Lakh to INR 30 Lakhs.',
          '4th through 8th Prizes: Awarded based on matching the last 4 digits (e.g. INR 5,000 for 4th prize down to INR 100 for 8th prize), creating thousands of individual winners across the state.',
        ],
      },
      {
        id: 'consolation-calculation',
        title: 'How Consolation Prizes Are Calculated',
        paragraphs: [
          'In a standard weekly draw, 12 ticket series are printed (e.g. AA, AB, AC, AD, AE, AF, AG, AH, AJ, AK, AL, AM). When one series wins the first prize, the remaining 11 series bearing the exact same 6 digits automatically receive the Consolation Prize.',
        ],
      },
      {
        id: 'tax-tds-rules',
        title: 'Income Tax TDS Deductions (Section 194B)',
        paragraphs: [
          'Under Section 194B of the Indian Income Tax Act, any lottery prize winnings exceeding INR 10,000 are subject to a mandatory 30% Tax Deducted at Source (TDS) prior to disbursement.',
          'In addition, agent commission (typically 10% on top prizes) is paid directly by the Directorate, and applicable educational cess and surcharges are factored into high-bracket individual earnings.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are lottery winnings below INR 10,000 subject to TDS deduction in Kerala?',
        answer: 'No. Prize winnings of INR 10,000 or below are paid in full without TDS deduction at source. Claimants must still report earnings in their annual income tax returns.',
      },
      {
        question: 'What is the highest lottery prize in Kerala?',
        answer: 'The highest state prize is the annual Thiruvonam Bumper (Onam Bumper), featuring a first prize of INR 25 Crore.',
      },
    ],
  },
  {
    id: 'kerala-lottery-draw-schedule-timetable',
    slug: 'kerala-lottery-draw-schedule-timetable',
    category: 'Draw Process',
    title: 'Kerala Lottery Weekly Draw Schedule & Annual Timetable 2026',
    subtitle: 'The authoritative day-by-day timetable for weekly draws (Monday to Sunday) and major annual bumper releases.',
    excerpt: 'Check the complete weekly schedule of Kerala State Lotteries from Monday through Sunday, draw times, scheme codes, ticket prices, and annual bumper dates.',
    publishedAt: '2026-08-12',
    updatedAt: '2026-08-28',
    author: 'KeralaDraws Editorial Desk',
    readTime: '4 min read',
    tableOfContents: [
      { id: 'weekly-draw-schedule', title: 'Official Weekly Draw Timetable' },
      { id: 'bumper-draw-calendar', title: 'Annual Seasonal Bumper Calendar' },
      { id: 'timing-and-results', title: 'Draw Timings & Result Publishing Flow' },
    ],
    sections: [
      {
        id: 'weekly-draw-schedule',
        title: 'Official Weekly Draw Timetable',
        paragraphs: [
          'The Directorate of Kerala State Lotteries operates seven distinct weekly lottery schemes, held each day from Monday to Sunday at 3:00 PM IST:',
          '• Monday: Bhagya Thara (Code: BT, Ticket: ₹40, 1st Prize: ₹1 Crore)',
          '• Tuesday: Sthree Sakthi (Code: SS, Ticket: ₹40, 1st Prize: ₹75 Lakhs)',
          '• Wednesday: Fifty-Fifty (Code: FF, Ticket: ₹50, 1st Prize: ₹1 Crore)',
          '• Thursday: Karunya Plus (Code: KN, Ticket: ₹40, 1st Prize: ₹80 Lakhs)',
          '• Friday: Suvarna Keralam (Code: SK, Ticket: ₹40, 1st Prize: ₹1 Crore)',
          '• Saturday: Karunya (Code: KR, Ticket: ₹40, 1st Prize: ₹80 Lakhs)',
          '• Sunday: Samrudhi / Akshaya (Code: SM, Ticket: ₹40, 1st Prize: ₹1 Crore)',
        ],
      },
      {
        id: 'bumper-draw-calendar',
        title: 'Annual Seasonal Bumper Calendar',
        paragraphs: [
          'In addition to weekly schemes, six major bumper lotteries are conducted throughout the year to celebrate festive seasons:',
          '• Thiruvonam Bumper (September / October) — 1st Prize: ₹25 Crore (Ticket: ₹500)',
          '• Pooja Bumper (November / December) — 1st Prize: ₹12 Crore (Ticket: ₹300)',
          '• Xmas New Year Bumper (January) — 1st Prize: ₹20 Crore (Ticket: ₹400)',
          '• Summer Bumper (March / April) — 1st Prize: ₹10 Crore (Ticket: ₹250)',
          '• Vishu Bumper (May / June) — 1st Prize: ₹12 Crore (Ticket: ₹300)',
          '• Monsoon Bumper (July / August) — 1st Prize: ₹10 Crore (Ticket: ₹250)',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are there any days when Kerala lottery draws are not conducted?',
        answer: 'Draws are held 7 days a week. Exceptions occur only on designated national holidays or rare administrative force majeure declarations officially gazetted by the Government.',
      },
    ],
  },
  {
    id: 'how-to-verify-kerala-lottery-results',
    slug: 'how-to-verify-kerala-lottery-results',
    category: 'Verification',
    title: 'How to Verify Kerala Lottery Results with the Official Gazette',
    subtitle: 'Essential verification steps before claiming prize money: checking LOTIS PDF records, avoiding fake printouts, and gazette validation.',
    excerpt: 'Detailed guide on cross-checking Kerala Lottery winning numbers against official Government Gazette publications and LOTIS records to ensure 100% validity.',
    publishedAt: '2026-08-10',
    updatedAt: '2026-08-28',
    author: 'KeralaDraws Security Desk',
    readTime: '4 min read',
    tableOfContents: [
      { id: 'why-verify', title: 'Why Gazette Verification Is Mandatory' },
      { id: 'official-lotis-steps', title: 'Step-by-Step LOTIS Gazette Verification' },
      { id: 'identifying-counterfeits', title: 'Identifying Fake & Modified Results' },
    ],
    sections: [
      {
        id: 'why-verify',
        title: 'Why Gazette Verification Is Mandatory',
        paragraphs: [
          'While digital platforms like KeralaDraws synchronize automatically with the government portal within minutes of draw conclusion, legal claim settlement requires physical ticket verification against the official published Kerala Government Gazette.',
          'The Government of Kerala Directorate of State Lotteries is legally bound only by the certified Gazette notification signed by the Director of State Lotteries.',
        ],
      },
      {
        id: 'official-lotis-steps',
        title: 'Step-by-Step LOTIS Gazette Verification',
        paragraphs: [
          '1. Visit the official government lottery portal at `lotteryagent.kerala.gov.in` or access the direct PDF document link provided on every KeralaDraws result page.',
          '2. Match the Draw Number, Scheme Name, and Date printed at the top of the official PDF with your physical ticket.',
          '3. Check the signatures of the Deputy Director and Joint Director of State Lotteries on the final page of the gazette.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can digital screenshots be used to claim lottery prize money?',
        answer: 'No. Prize claims require the physical, original winning ticket. Digital screenshots, photocopies, or third-party website printouts are not accepted for prize redemption.',
      },
    ],
  },
  {
    id: 'how-to-claim-kerala-lottery-prize-money',
    slug: 'how-to-claim-kerala-lottery-prize-money',
    category: 'Rules & Claims',
    title: 'Complete Step-by-Step Guide to Claiming Kerala Lottery Prize Money',
    subtitle: 'Submission venues, required documents, bank procedures, and income tax compliance for winning tickets.',
    excerpt: 'Authoritative walkthrough of the claim process for prizes below ₹5,000, between ₹5,000 and ₹1 Lakh, and jackpots exceeding ₹1 Lakh in Kerala.',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-28',
    author: 'Legal & Compliance Bureau',
    readTime: '6 min read',
    tableOfContents: [
      { id: 'claim-venues-by-amount', title: 'Claim Venues by Prize Amount' },
      { id: 'required-documents', title: 'Mandatory Claim Documentation' },
      { id: 'bank-submission-process', title: 'Bank Submission Process' },
      { id: 'taxation-and-deductions', title: 'Taxation & Net Payout Calculations' },
    ],
    sections: [
      {
        id: 'claim-venues-by-amount',
        title: 'Claim Venues by Prize Amount',
        paragraphs: [
          '• Prizes up to ₹5,000: Can be claimed immediately at any authorized lottery shop or agent across Kerala upon handing over the original ticket.',
          '• Prizes between ₹5,000 and ₹1 Lakh: Must be claimed at any District Lottery Office (DLO) in Kerala along with identity verification documents.',
          '• Prizes exceeding ₹1 Lakh: Must be presented to the Directorate of State Lotteries, Vikas Bhavan, Thiruvananthapuram, or submitted through a nationalized / scheduled bank.',
        ],
      },
      {
        id: 'required-documents',
        title: 'Mandatory Claim Documentation',
        paragraphs: [
          'For claims submitted to District Lottery Offices or the Directorate, claimants must provide:',
          '1. The original winning ticket signed on the reverse with full name, address, and signature.',
          '2. Completed Claim Application Form (Form VIII / IX as per Kerala Paper Lotteries Rules).',
          '3. Two passport-size photographs attested by a Gazetted Officer / Notary Public.',
          '4. Self-attested copy of PAN Card.',
          '5. Self-attested copy of Photo Identity & Address Proof (Aadhaar Card, Passport, Voter ID, or Driving License).',
          '6. Stamped receipt for the prize amount.',
          '7. Cancelled bank cheque leaf / bank passbook copy showing Account Number and IFSC Code for direct NEFT/RTGS transfer.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can non-residents of Kerala buy tickets and claim prize money?',
        answer: 'Yes, tickets purchased physically within the territory of Kerala by any Indian citizen aged 18+ can be claimed through nationalized banks or directly at the Directorate in Thiruvananthapuram.',
      },
    ],
  },
  {
    id: 'keraladraws-alerts-and-notifications-guide',
    slug: 'keraladraws-alerts-and-notifications-guide',
    category: 'Tools & Alerts',
    title: 'How KeralaDraws Push Notifications & Ticket Watchlist Work',
    subtitle: 'Learn how to enable instant browser alerts, configure selective lottery updates, and monitor saved tickets with Firebase Cloud Messaging.',
    excerpt: 'Detailed guide to subscribing to KeralaDraws instant draw alerts, customizing scheme preferences, and managing saved tickets safely without privacy intrusion.',
    publishedAt: '2026-08-05',
    updatedAt: '2026-08-28',
    author: 'KeralaDraws Technology Desk',
    readTime: '4 min read',
    tableOfContents: [
      { id: 'how-fcm-works', title: 'Firebase Web Push Technology' },
      { id: 'selective-preferences', title: 'Setting Selective Lottery Subscriptions' },
      { id: 'saved-ticket-monitoring', title: 'Saved Ticket Watchlist Monitoring' },
      { id: 'managing-privacy', title: 'Managing Permissions & Privacy' },
    ],
    sections: [
      {
        id: 'how-fcm-works',
        title: 'Firebase Web Push Technology',
        paragraphs: [
          'KeralaDraws utilizes Google Firebase Cloud Messaging (FCM) to deliver lightweight, instant web push notifications directly to your browser on desktop and mobile devices.',
          'When the official Supabase sync engine verifies a certified LOTIS gazette at 3:00 PM, a multicast dispatch triggers an instant notification without requiring you to refresh the website.',
        ],
      },
      {
        id: 'saved-ticket-monitoring',
        title: 'Saved Ticket Watchlist Monitoring',
        paragraphs: [
          'You can add your purchased ticket numbers to your personal Watchlist on KeralaDraws. The system keeps your ticket stored locally on your device and evaluates it against certified winning lists the second results are published.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do push notifications cost anything or require email registration?',
        answer: 'No. KeralaDraws push notifications are 100% free and do not require email addresses, phone numbers, or account passwords.',
      },
    ],
  },
  {
    id: 'responsible-lottery-information',
    slug: 'responsible-lottery-information',
    category: 'Rules & Claims',
    title: 'Responsible Lottery Information & Statutory Safeguards',
    subtitle: 'Understanding legal age restrictions, financial self-discipline, and statutory consumer protection guidelines.',
    excerpt: 'Important guidelines on responsible participation in Kerala State Lotteries, legal age limits, and statutory consumer protections.',
    publishedAt: '2026-08-01',
    updatedAt: '2026-08-28',
    author: 'Editorial & Compliance Desk',
    readTime: '4 min read',
    tableOfContents: [
      { id: 'legal-framework', title: 'Statutory Age & Territorial Jurisdiction' },
      { id: 'financial-prudence', title: 'Financial Self-Discipline' },
      { id: 'independent-transparency', title: 'Independent Informational Transparency' },
    ],
    sections: [
      {
        id: 'legal-framework',
        title: 'Statutory Age & Territorial Jurisdiction',
        paragraphs: [
          'Lottery participation in Kerala is regulated under the Lotteries (Regulation) Act, 1998. Purchasing state lottery tickets is strictly restricted to individuals aged 18 years and older within authorized geographic boundaries.',
          'Paper tickets must be purchased physically through licensed lottery vendors and retailers. Online purchase, digital lottery apps, and internet sales of Kerala lottery tickets are strictly prohibited under state regulations.',
        ],
      },
      {
        id: 'financial-prudence',
        title: 'Financial Self-Discipline',
        paragraphs: [
          'Lottery games are games of pure chance with high statistical odds. Participants should treat lottery purchases strictly as recreational entertainment and never spend beyond their discretionary financial means.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is it legal to buy Kerala lottery tickets online?',
        answer: 'No. Under Kerala State Lottery rules, tickets are sold exclusively in physical paper format through authorized retailers. Any portal claiming to sell digital Kerala lottery tickets online is unauthorized.',
      },
    ],
  },
];

export function getAllGuides(): GuideArticle[] {
  return GUIDES;
}

export function getFeaturedGuide(): GuideArticle {
  return GUIDES.find((g) => g.featured) || GUIDES[0];
}

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: string): GuideArticle[] {
  return GUIDES.filter((g) => g.category.toLowerCase() === category.toLowerCase());
}
