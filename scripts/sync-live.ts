import { syncLiveResults } from '../lib/sources/keralalotteries/sync';
import { prisma } from '../lib/prisma';

async function main() {
  const result = await syncLiveResults();
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
