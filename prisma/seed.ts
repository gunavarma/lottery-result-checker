import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const LOTTERY_SCHEMES = [
  {
    name: 'Bhagya Thara',
    slug: 'bhagya-thara',
    code: 'BT',
    drawDay: 'Monday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Bhagya Thara is a weekly Kerala state lottery scheme drawn every Monday at 3:00 PM at Gorky Bhavan, Thiruvananthapuram.',
  },
  {
    name: 'Sthree Sakthi',
    slug: 'sthree-sakthi',
    code: 'SS',
    drawDay: 'Tuesday',
    drawTime: '3:00 PM',
    ticketPrice: 50,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Sthree Sakthi is a popular weekly lottery scheme drawn every Tuesday with a 1st prize of ₹1 Crore and comprehensive lower prize tiers.',
  },
  {
    name: 'Dhanalekshmi',
    slug: 'dhanalekshmi',
    code: 'DL',
    drawDay: 'Wednesday',
    drawTime: '3:00 PM',
    ticketPrice: 50,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Dhanalekshmi is a weekly lottery scheme conducted every Wednesday offering substantial prize opportunities.',
  },
  {
    name: 'Fifty-Fifty',
    slug: 'fifty-fifty',
    code: 'FF',
    drawDay: 'Wednesday',
    drawTime: '3:00 PM',
    ticketPrice: 50,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Fifty-Fifty is drawn every Wednesday with a top prize of ₹1 Crore and 2nd prize of ₹30 Lakhs.',
  },
  {
    name: 'Karunya Plus',
    slug: 'karunya-plus',
    code: 'KN',
    drawDay: 'Thursday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Karunya Plus is drawn every Thursday at 3:00 PM. A portion of proceeds contributes to welfare initiatives in Kerala.',
  },
  {
    name: 'Suvarna Keralam',
    slug: 'suvarna-keralam',
    code: 'SK',
    drawDay: 'Friday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Suvarna Keralam is conducted every Friday with a 1st prize of ₹1 Crore, 2nd prize of ₹30 Lakhs, and 3rd prize of ₹5 Lakhs.',
  },
  {
    name: 'Nirmal',
    slug: 'nirmal',
    code: 'NR',
    drawDay: 'Friday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(7000000), // 70 Lakhs
    isBumper: false,
    description: 'Nirmal lottery is drawn every Friday offering an attractive prize structure and multiple consolation awards.',
  },
  {
    name: 'Karunya',
    slug: 'karunya',
    code: 'KR',
    drawDay: 'Saturday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Karunya lottery is conducted every Saturday at 3:00 PM with proceeds supporting healthcare assistance programs.',
  },
  {
    name: 'Samrudhi',
    slug: 'samrudhi',
    code: 'samrudhi',
    codePrefix: 'SM',
    drawDay: 'Sunday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(10000000), // 1 Crore
    isBumper: false,
    description: 'Samrudhi is a weekly Sunday lottery offering lucrative prizes across 9 prize tiers.',
  },
  {
    name: 'Akshaya',
    slug: 'akshaya',
    code: 'AK',
    drawDay: 'Sunday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(7000000), // 70 Lakhs
    isBumper: false,
    description: 'Akshaya is drawn on Sundays, known for high winner density in lower tiers.',
  },
  {
    name: 'Win-Win',
    slug: 'win-win',
    code: 'W',
    drawDay: 'Sunday',
    drawTime: '3:00 PM',
    ticketPrice: 40,
    firstPrizeAmount: BigInt(7500000), // 75 Lakhs
    isBumper: false,
    description: 'Win-Win is one of the classic lottery schemes operated by the Kerala State Lotteries Department.',
  },
  {
    name: 'Thiruvonam Bumper',
    slug: 'thiruvonam-bumper',
    code: 'BR-99',
    drawDay: 'Annual Bumper (September)',
    drawTime: '2:00 PM',
    ticketPrice: 500,
    firstPrizeAmount: BigInt(250000000), // 25 Crore
    isBumper: true,
    description: 'Thiruvonam Bumper is the largest lottery in India with a bumper 1st prize of ₹25 Crore.',
  },
  {
    name: 'Vishu Bumper',
    slug: 'vishu-bumper',
    code: 'BR-109',
    drawDay: 'Seasonal Bumper (May)',
    drawTime: '2:00 PM',
    ticketPrice: 300,
    firstPrizeAmount: BigInt(120000000), // 12 Crore
    isBumper: true,
    description: 'Vishu Bumper is conducted annually celebrating the Vishu festival with a ₹12 Crore 1st prize.',
  },
  {
    name: 'Pooja Bumper',
    slug: 'pooja-bumper',
    code: 'BR-102',
    drawDay: 'Seasonal Bumper (November)',
    drawTime: '2:00 PM',
    ticketPrice: 300,
    firstPrizeAmount: BigInt(120000000), // 12 Crore
    isBumper: true,
    description: 'Pooja Bumper offers massive festival winnings including multiple crore awards.',
  },
  {
    name: "X'mas New Year Bumper",
    slug: 'xmas-new-year-bumper',
    code: 'BR-98',
    drawDay: 'Seasonal Bumper (January)',
    drawTime: '2:00 PM',
    ticketPrice: 400,
    firstPrizeAmount: BigInt(200000000), // 20 Crore
    isBumper: true,
    description: "X'mas New Year Bumper celebrates the festive new year season with a ₹20 Crore top prize.",
  },
  {
    name: 'Monsoon Bumper',
    slug: 'monsoon-bumper',
    code: 'BR-104',
    drawDay: 'Seasonal Bumper (July)',
    drawTime: '2:00 PM',
    ticketPrice: 250,
    firstPrizeAmount: BigInt(100000000), // 10 Crore
    isBumper: true,
    description: 'Monsoon Bumper is drawn in July with a 1st prize of ₹10 Crore.',
  },
  {
    name: 'Summer Bumper',
    slug: 'summer-bumper',
    code: 'BR-100',
    drawDay: 'Seasonal Bumper (March)',
    drawTime: '2:00 PM',
    ticketPrice: 250,
    firstPrizeAmount: BigInt(100000000), // 10 Crore
    isBumper: true,
    description: 'Summer Bumper is drawn annually in March offering high rewards.',
  },
];

async function seed() {
  console.log('Seeding Kerala Lottery schemes...');

  for (const s of LOTTERY_SCHEMES) {
    const code = s.code || (s as any).codePrefix || s.slug.toUpperCase();
    await prisma.lottery.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        code,
        drawDay: s.drawDay,
        drawTime: s.drawTime,
        ticketPrice: s.ticketPrice,
        isBumper: s.isBumper,
        description: s.description,
      },
      create: {
        name: s.name,
        slug: s.slug,
        code,
        drawDay: s.drawDay,
        drawTime: s.drawTime,
        ticketPrice: s.ticketPrice,
        isBumper: s.isBumper,
        description: s.description,
      },
    });
  }

  console.log(`Seeded ${LOTTERY_SCHEMES.length} lottery schemes.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
