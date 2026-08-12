require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const StockMovement = require('./models/StockMovement');
const PurchaseOrder = require('./models/PurchaseOrder');

const defaultCategories = [
  { name: 'Cement & Aggregates', description: 'Cement, sand, stone, and bulk aggregates' },
  { name: 'Electrical', description: 'Cabling, fittings, switchgear, and lighting' },
  { name: 'Plumbing', description: 'Pipes, fittings, tanks, and sanitary ware' },
  { name: 'Finishing', description: 'Paint, tiles, ceilings, and finishing materials' },
  { name: 'Hardware', description: 'Fasteners, tools, and general hardware' },
  { name: 'Timber & Formwork', description: 'Timber, plywood, and formwork supplies' },
];

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      Item.deleteMany({}),
      StockMovement.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      Supplier.deleteMany({}),
      Category.deleteMany({}),
      User.deleteMany({}),
    ]);

    await User.create({
      name: 'Saka Admin',
      email: 'admin@sakahomes.com',
      password: 'password123',
    });

    await Category.insertMany(defaultCategories);

    console.log('Seed complete — inventory empty, default categories ready');
    console.log('Login: admin@sakahomes.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
