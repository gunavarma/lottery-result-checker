export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export const HOMEPAGE_FAQS: FAQItem[] = [
  {
    question: 'When are Kerala lottery results published today?',
    answer:
      'Official Kerala State Lottery draws commence daily at 3:00 PM IST at Gorky Bhavan, near Bakery Junction, Thiruvananthapuram. The mechanical ball-draw takes place before a panel of independent judges. Live results are announced between 3:00 PM and 4:00 PM IST, and the official verified LOTIS Gazette PDF document is signed and released by the Directorate of Kerala State Lotteries between 4:00 PM and 4:30 PM IST.',
    category: 'Draw Schedule',
  },
  {
    question: 'What is the weekly draw timetable for Kerala State Lotteries?',
    answer:
      'Kerala conducts 7 weekly recurring lottery draws: Monday is Bhagya Thara (₹1 Crore 1st Prize, ₹40), Tuesday is Sthree Sakthi (₹1 Crore 1st Prize, ₹50), Wednesday is Fifty-Fifty / Dhanalekshmi (₹1 Crore 1st Prize, ₹50), Thursday is Karunya Plus (₹1 Crore 1st Prize, ₹40), Friday is Suvarna Keralam / Nirmal (₹1 Crore 1st Prize, ₹40), Saturday is Karunya (₹1 Crore 1st Prize, ₹40), and Sunday is Samrudhi / Akshaya (₹1 Crore 1st Prize, ₹40).',
    category: 'Weekly Schemes',
  },
  {
    question: 'How do I check my Kerala lottery ticket number online?',
    answer:
      'You can verify your ticket using our instant Ticket Checker on this page. Simply choose your lottery scheme, enter your 6-digit ticket number (and optional series code), and click "Check Ticket". Our system instantly matches your number against the 1st prize, 2nd prize, 3rd prize, consolation prizes, and all ending 4-digit tiers declared in the official gazette.',
    category: 'Ticket Verification',
  },
  {
    question: 'How do I claim my Kerala Lottery prize money?',
    answer:
      'For prizes up to ₹1,00,000, winners can claim the amount through authorized lottery agents or any of the 14 District Lottery Offices (DLO) across Kerala. For prizes exceeding ₹1,00,000, winners must submit the original winning ticket (signed on the reverse with name and address), self-attested copies of government ID (Aadhaar, PAN Card), 2 passport photos, and bank account details directly to the Directorate of State Lotteries in Thiruvananthapuram or through a nationalized bank within 90 days from the draw date.',
    category: 'Prize Claims',
  },
  {
    question: 'What taxes (TDS) and deductions apply to Kerala lottery winnings?',
    answer:
      'Under Section 194B of the Indian Income Tax Act, lottery winnings exceeding ₹10,000 are subject to a flat 30% TDS (Tax Deducted at Source), along with applicable educational cess (4%), resulting in an effective tax rate of 31.2%. Authorized lottery agents receive an additional statutory 10% agent commission, which is disbursed directly by the Government of Kerala.',
    category: 'Tax & TDS',
  },
  {
    question: 'What are Kerala Bumper Lotteries and their jackpot amounts?',
    answer:
      'The Government of Kerala releases 6 seasonal bumper lotteries each year featuring massive jackpot prizes: Thiruvonam Bumper (₹25 Crore, drawn in September), X\'mas New Year Bumper (₹20 Crore, drawn in January), Vishu Bumper (₹12 Crore, drawn in May), Pooja Bumper (₹12 Crore, drawn in November), Monsoon Bumper (₹10 Crore, drawn in July), and Summer Bumper (₹10 Crore, drawn in March).',
    category: 'Bumper Jackpots',
  },
  {
    question: 'Is this an official Government of Kerala website?',
    answer:
      'No. KeralaDraws is an independent digital information and verification portal. Our automated ingestion system synchronizes verified draw data from the official LOTIS portal (lotteryagent.kerala.gov.in) operated by the Directorate of Kerala State Lotteries. Live results during the 3:00 PM draw are displayed from public live sources and are always marked provisional until confirmed by the official Government Gazette. Winners should always confirm their numbers against the official Kerala Gazette before submitting claim forms.',
    category: 'Official Transparency',
  },
];
