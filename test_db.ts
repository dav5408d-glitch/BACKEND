
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database successfully');

        const count = await prisma.user.count();
        console.log(`📊 User count: ${count}`);

        const users = await prisma.user.findMany({ take: 5 });
        console.log('👥 First 5 users:', users);

    } catch (e) {
        console.error('❌ Database error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
