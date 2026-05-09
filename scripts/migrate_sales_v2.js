const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration for Sales...");
  const sales = await prisma.sale.findMany({
    where: {
      productId: { not: null },
    },
  });

  console.log(`Found ${sales.length} sales to migrate.`);

  for (const sale of sales) {
    if (sale.productId) {
      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: sale.productId,
          quantity: sale.quantity || 0,
          rate: sale.rate || 0,
          pricePerUnit: sale.pricePerUnit || 0,
          totalAmount: (sale.quantity || 0) * (sale.rate || 0),
        },
      });
      
      // Clear the old fields
      await prisma.sale.update({
        where: { id: sale.id },
        data: {
          productId: null,
          quantity: null,
          rate: null,
          pricePerUnit: null,
        },
      });
    }
  }

  console.log("Migration completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
