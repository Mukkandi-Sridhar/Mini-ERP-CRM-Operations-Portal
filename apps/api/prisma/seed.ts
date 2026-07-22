import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ReferenceType, ChallanStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mini ERP + CRM database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users (1 per role)
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@minierp.com',
      passwordHash,
      role: Role.Admin,
      isActive: true,
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Sarah Sales',
      email: 'sales@minierp.com',
      passwordHash,
      role: Role.Sales,
      isActive: true,
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Wayne Warehouse',
      email: 'warehouse@minierp.com',
      passwordHash,
      role: Role.Warehouse,
      isActive: true,
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Alice Accounts',
      email: 'accounts@minierp.com',
      passwordHash,
      role: Role.Accounts,
      isActive: true,
    },
  });

  console.log('Users created: admin, sales, warehouse, accounts.');

  // 2. Seed Customers (~15 customers)
  const customerData = [
    { name: 'Rajesh Traders', mobile: '9876543210', email: 'rajesh@rajeshtraders.com', businessName: 'Rajesh Enterprise Pvt Ltd', gstNumber: '27AAAAA0000A1Z5', type: CustomerType.Wholesale, address: '102 Industrial Area Phase 1, Mumbai', status: CustomerStatus.Active },
    { name: 'Apex Logistics Supplies', mobile: '9812345678', email: 'contact@apexlogistics.in', businessName: 'Apex Logistics & Distribution', gstNumber: '27BBBBB1111B2Z6', type: CustomerType.Distributor, address: 'G-12 Commerce Hub, Pune', status: CustomerStatus.Active },
    { name: 'Modern Retail Hub', mobile: '9765432109', email: 'support@modernretail.com', businessName: 'Modern Retail Stores LLP', gstNumber: '27CCCCC2222C3Z7', type: CustomerType.Retail, address: 'Shop 45 City Center Mall, Thane', status: CustomerStatus.Active },
    { name: 'Vanguard Electronics', mobile: '9654321098', email: 'purchase@vanguardelec.com', businessName: 'Vanguard Electrical Corp', gstNumber: '27DDDDD3333D4Z8', type: CustomerType.Wholesale, address: 'Plot 88 MIDC Electronic Zone, Navi Mumbai', status: CustomerStatus.Lead, followUpDate: new Date('2026-07-25T10:00:00Z'), notes: 'Interested in bulk power supply cables.' },
    { name: 'Global Tech Supplies', mobile: '9543210987', email: 'info@globaltechsupplies.com', businessName: 'Global Tech Distribution Ltd', gstNumber: '27EEEEE4444E5Z9', type: CustomerType.Distributor, address: 'Building 4 Technopark, Bengaluru', status: CustomerStatus.Active },
    { name: 'Sunshine Hardware Store', mobile: '9432109876', email: 'sunshine@hardwarehub.in', businessName: 'Sunshine Enterprises', gstNumber: '27FFFFF5555F6Z0', type: CustomerType.Retail, address: '12 Station Road, Nagpur', status: CustomerStatus.Active },
    { name: 'Metro Buildcon & Infra', mobile: '9321098765', email: 'procurement@metrobuildcon.org', businessName: 'Metro Buildcon Solutions', gstNumber: '27GGGGG6666G7Z1', type: CustomerType.Wholesale, address: '501 Express Towers, Ahmedabad', status: CustomerStatus.Lead, followUpDate: new Date('2026-07-23T14:30:00Z'), notes: 'Waiting for Q3 wholesale pricing matrix.' },
    { name: 'National Paper Mills', mobile: '9210987654', email: 'supply@nationalpaper.co.in', businessName: 'National Paper Industries', gstNumber: '27HHHHH7777H8Z2', type: CustomerType.Distributor, address: '78 River Front Estate, Nashik', status: CustomerStatus.Inactive },
    { name: 'Zenith Fasteners', mobile: '9109876543', email: 'sales@zenithfasteners.com', businessName: 'Zenith Fasteners India', gstNumber: '27IIIII8888I9Z3', type: CustomerType.Wholesale, address: 'A-4 Industrial Estate, Vadodara', status: CustomerStatus.Active },
    { name: 'Pioneer Tools & Dies', mobile: '9098765432', email: 'info@pioneertools.com', businessName: 'Pioneer Engineering Works', gstNumber: '27JJJJJ9999J0Z4', type: CustomerType.Wholesale, address: '89 GT Road, Surat', status: CustomerStatus.Active },
    { name: 'Delta Chemical Co', mobile: '8987654321', email: 'admin@deltachem.in', businessName: 'Delta Chemical Distributors', gstNumber: '27KKKKK1010K1Z5', type: CustomerType.Distributor, address: 'C-15 Chemical Complex, Vapi', status: CustomerStatus.Lead },
    { name: 'Shree Krishna General Stores', mobile: '8876543210', email: 'skgstores@gmail.com', businessName: 'Shree Krishna Traders', gstNumber: null, type: CustomerType.Retail, address: 'Main Market, Kolhapur', status: CustomerStatus.Active },
    { name: 'Om Sai Electricals', mobile: '8765432109', email: 'omsai.elec@yahoo.com', businessName: 'Om Sai Electrical Works', gstNumber: null, type: CustomerType.Retail, address: 'Near Bus Stand, Solapur', status: CustomerStatus.Active },
    { name: 'Bharat Packaging Solutions', mobile: '8654321098', email: 'orders@bharatpack.com', businessName: 'Bharat Packaging India Pvt Ltd', gstNumber: '27LLLLL2020L2Z6', type: CustomerType.Wholesale, address: 'Plot 34 Logistics Park, Bhiwandi', status: CustomerStatus.Active },
    { name: 'Star Stationers & Printers', mobile: '8543210987', email: 'star.stationers@outlook.com', businessName: 'Star Printing Press', gstNumber: null, type: CustomerType.Retail, address: '45 College Road, Aurangabad', status: CustomerStatus.Lead },
  ];

  const customers = [];
  for (const c of customerData) {
    const customer = await prisma.customer.create({
      data: {
        ...c,
        createdById: sales.id,
      },
    });
    customers.push(customer);
  }
  console.log(`${customers.length} Customers created.`);

  // Follow-ups for leads
  await prisma.followUp.create({
    data: {
      customerId: customers[3].id,
      note: 'Initial call completed. Requested quote for 500 units of heavy duty cable.',
      followUpDate: new Date('2026-07-25T10:00:00Z'),
      createdById: sales.id,
    },
  });

  await prisma.followUp.create({
    data: {
      customerId: customers[6].id,
      note: 'Sent introductory catalog. Meeting scheduled for price discussion.',
      followUpDate: new Date('2026-07-23T14:30:00Z'),
      createdById: sales.id,
    },
  });

  // 3. Seed Products (~20 products across categories, some low stock)
  const productData = [
    { name: 'Industrial Power Cable 10m', sku: 'CAB-IND-10M', category: 'Electrical', unitPrice: 1250.00, currentStock: 45, minStockAlert: 15, warehouseLocation: 'Rack A-12' },
    { name: 'Heavy Duty Circuit Breaker 63A', sku: 'MCB-HD-63A', category: 'Electrical', unitPrice: 850.50, currentStock: 3, minStockAlert: 10, warehouseLocation: 'Rack A-14' }, // LOW STOCK
    { name: 'LED High Bay Light 150W', sku: 'LED-HB-150W', category: 'Lighting', unitPrice: 3200.00, currentStock: 18, minStockAlert: 5, warehouseLocation: 'Rack B-03' },
    { name: 'Pneumatic Control Valve 1/2"', sku: 'VAL-PNU-050', category: 'Pneumatics', unitPrice: 2450.00, currentStock: 2, minStockAlert: 8, warehouseLocation: 'Rack C-01' }, // LOW STOCK
    { name: 'Stainless Steel Bolt M10x50 (Box 100)', sku: 'BLT-SS-M1050', category: 'Fasteners', unitPrice: 450.00, currentStock: 120, minStockAlert: 20, warehouseLocation: 'Bin F-09' },
    { name: 'High Temperature Silicone Sealant', sku: 'SLN-HT-300ML', category: 'Adhesives', unitPrice: 380.00, currentStock: 4, minStockAlert: 15, warehouseLocation: 'Bin G-02' }, // LOW STOCK
    { name: 'Digital Multimeter Pro', sku: 'TL-DMM-PRO', category: 'Tools', unitPrice: 2900.00, currentStock: 25, minStockAlert: 5, warehouseLocation: 'Rack D-05' },
    { name: 'Hydraulic Hose Assembly 2m', sku: 'HSE-HYD-02M', category: 'Hydraulics', unitPrice: 1850.00, currentStock: 14, minStockAlert: 10, warehouseLocation: 'Rack C-08' },
    { name: 'Safety Helmet Class E', sku: 'PPE-HLM-CLS', category: 'Safety Equipment', unitPrice: 650.00, currentStock: 80, minStockAlert: 25, warehouseLocation: 'Rack E-01' },
    { name: 'Cut-Resistant Work Gloves (Pair)', sku: 'PPE-GLV-CUT', category: 'Safety Equipment', unitPrice: 220.00, currentStock: 150, minStockAlert: 30, warehouseLocation: 'Bin E-04' },
    { name: 'Polypropylene Strapping Band 12mm', sku: 'PKG-STP-12MM', category: 'Packaging', unitPrice: 1400.00, currentStock: 30, minStockAlert: 10, warehouseLocation: 'Rack H-02' },
    { name: 'Stretch Wrap Film Roll 500mm', sku: 'PKG-STW-500', category: 'Packaging', unitPrice: 890.00, currentStock: 1, minStockAlert: 12, warehouseLocation: 'Rack H-05' }, // LOW STOCK
    { name: 'Copper Terminal Lug 50sqmm (Pack 50)', sku: 'LUG-CU-50SQ', category: 'Electrical', unitPrice: 950.00, currentStock: 60, minStockAlert: 15, warehouseLocation: 'Bin A-20' },
    { name: 'Industrial Exhaust Fan 24"', sku: 'FAN-EXH-24IN', category: 'Ventilation', unitPrice: 6800.00, currentStock: 8, minStockAlert: 3, warehouseLocation: 'Floor Z-01' },
    { name: 'Brass Ball Valve 1"', sku: 'VAL-BRS-100', category: 'Plumbing', unitPrice: 720.00, currentStock: 40, minStockAlert: 15, warehouseLocation: 'Bin C-12' },
    { name: 'Pressure Gauge 0-10 Bar', sku: 'GAU-PRS-10B', category: 'Instrumentation', unitPrice: 1150.00, currentStock: 22, minStockAlert: 8, warehouseLocation: 'Bin D-11' },
    { name: 'Heat Shrink Tube Assortment Kit', sku: 'HST-KIT-400', category: 'Electrical', unitPrice: 590.00, currentStock: 35, minStockAlert: 10, warehouseLocation: 'Bin A-25' },
    { name: 'Bearing 6204-2RS Deep Groove', sku: 'BRG-6204-2RS', category: 'Mechanical', unitPrice: 340.00, currentStock: 90, minStockAlert: 20, warehouseLocation: 'Bin M-03' },
    { name: 'V-Belt B-52 Industrial', sku: 'BLT-VB-B52', category: 'Mechanical', unitPrice: 480.00, currentStock: 28, minStockAlert: 10, warehouseLocation: 'Rack M-10' },
    { name: 'Lithium Grease Cartridge 400g', sku: 'LUB-GRS-400G', category: 'Lubricants', unitPrice: 290.00, currentStock: 50, minStockAlert: 15, warehouseLocation: 'Bin G-08' },
  ];

  const products = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: p,
    });
    products.push(product);

    // Initial stock movement record for each product
    if (p.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: p.currentStock,
          movementType: MovementType.IN,
          reason: 'Initial stock load on system initialization',
          referenceType: ReferenceType.MANUAL,
          createdById: warehouse.id,
        },
      });
    }
  }
  console.log(`${products.length} Products created with initial stock movements.`);

  // 4. Seed Challans (Draft, Confirmed, Cancelled)
  // Confirmed Challan 1
  const confirmedChallan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-202607-000001',
      customerId: customers[0].id,
      status: ChallanStatus.Confirmed,
      totalQuantity: 15,
      totalAmount: 18750.00,
      createdById: sales.id,
      confirmedAt: new Date('2026-07-20T11:30:00Z'),
      items: {
        create: [
          {
            productId: products[0].id,
            productNameSnapshot: products[0].name,
            skuSnapshot: products[0].sku,
            unitPriceSnapshot: products[0].unitPrice,
            quantity: 10,
            lineTotal: 12500.00,
          },
          {
            productId: products[4].id,
            productNameSnapshot: products[4].name,
            skuSnapshot: products[4].sku,
            unitPriceSnapshot: products[4].unitPrice,
            quantity: 5,
            lineTotal: 2250.00,
          },
          {
            productId: products[6].id,
            productNameSnapshot: products[6].name,
            skuSnapshot: products[6].sku,
            unitPriceSnapshot: products[6].unitPrice,
            quantity: 1,
            lineTotal: 4000.00,
          },
        ],
      },
    },
  });

  // Stock movements for Confirmed Challan 1
  await prisma.stockMovement.createMany({
    data: [
      { productId: products[0].id, quantityChanged: 10, movementType: MovementType.OUT, reason: 'Challan Confirmed: CH-202607-000001', referenceType: ReferenceType.CHALLAN, referenceId: confirmedChallan1.id, createdById: sales.id },
      { productId: products[4].id, quantityChanged: 5, movementType: MovementType.OUT, reason: 'Challan Confirmed: CH-202607-000001', referenceType: ReferenceType.CHALLAN, referenceId: confirmedChallan1.id, createdById: sales.id },
      { productId: products[6].id, quantityChanged: 1, movementType: MovementType.OUT, reason: 'Challan Confirmed: CH-202607-000001', referenceType: ReferenceType.CHALLAN, referenceId: confirmedChallan1.id, createdById: sales.id },
    ],
  });

  // Draft Challan
  await prisma.challan.create({
    data: {
      customerId: customers[1].id,
      status: ChallanStatus.Draft,
      totalQuantity: 20,
      totalAmount: 64000.00,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products[2].id,
            productNameSnapshot: products[2].name,
            skuSnapshot: products[2].sku,
            unitPriceSnapshot: products[2].unitPrice,
            quantity: 20,
            lineTotal: 64000.00,
          },
        ],
      },
    },
  });

  // Cancelled Challan
  const cancelledChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-202607-000002',
      customerId: customers[2].id,
      status: ChallanStatus.Cancelled,
      totalQuantity: 2,
      totalAmount: 4900.00,
      createdById: sales.id,
      confirmedAt: new Date('2026-07-21T09:00:00Z'),
      cancelledAt: new Date('2026-07-21T14:00:00Z'),
      items: {
        create: [
          {
            productId: products[3].id,
            productNameSnapshot: products[3].name,
            skuSnapshot: products[3].sku,
            unitPriceSnapshot: products[3].unitPrice,
            quantity: 2,
            lineTotal: 4900.00,
          },
        ],
      },
    },
  });

  // Stock movement logs for cancelled challan (OUT then offsetting IN)
  await prisma.stockMovement.createMany({
    data: [
      { productId: products[3].id, quantityChanged: 2, movementType: MovementType.OUT, reason: 'Challan Confirmed: CH-202607-000002', referenceType: ReferenceType.CHALLAN, referenceId: cancelledChallan.id, createdById: sales.id },
      { productId: products[3].id, quantityChanged: 2, movementType: MovementType.IN, reason: 'Restock offset on Challan Cancelled: CH-202607-000002', referenceType: ReferenceType.CHALLAN, referenceId: cancelledChallan.id, createdById: sales.id },
    ],
  });

  console.log('Seeded 3 demo challans (Confirmed, Draft, Cancelled).');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
