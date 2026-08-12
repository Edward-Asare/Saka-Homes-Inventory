require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');

const sampleItems = [
  {
    name: 'Ceramic Floor Tile 60x60',
    sku: 'TILE-6060-WHT',
    category: 'Flooring',
    quantity: 240,
    unitPrice: 18.5,
    location: 'Warehouse A — Bay 3',
  },
  {
    name: 'Matte Black Door Handle',
    sku: 'HDW-DH-MB',
    category: 'Hardware',
    quantity: 4,
    unitPrice: 32.0,
    location: 'Warehouse B — Shelf 12',
  },
  {
    name: 'LED Recessed Downlight 12W',
    sku: 'LGT-LED-12W',
    category: 'Lighting',
    quantity: 18,
    unitPrice: 24.75,
    location: 'Warehouse A — Bay 1',
  },
  {
    name: 'Interior Emulsion Paint 20L',
    sku: 'PNT-EMU-20L',
    category: 'Paint',
    quantity: 8,
    unitPrice: 65.0,
    location: 'Warehouse C — Rack 2',
  },
  {
    name: 'PVC Soil Pipe 110mm',
    sku: 'PLB-PVC-110',
    category: 'Plumbing',
    quantity: 55,
    unitPrice: 12.4,
    location: 'Yard — Stack 4',
  },
  {
    name: 'Gypsum Ceiling Board 9mm',
    sku: 'CLG-GYP-9',
    category: 'Ceiling',
    quantity: 2,
    unitPrice: 9.8,
    location: 'Warehouse A — Bay 5',
  },
  {
    name: 'Oak Veneer Kitchen Cabinet',
    sku: 'KIT-CAB-OAK',
    category: 'Kitchen',
    quantity: 12,
    unitPrice: 185.0,
    location: 'Showroom — Zone K',
  },
  {
    name: 'Stainless Steel Kitchen Sink',
    sku: 'KIT-SNK-SS',
    category: 'Kitchen',
    quantity: 6,
    unitPrice: 145.0,
    location: 'Showroom — Zone K',
  },
];

const seed = async () => {
  try {
    await connectDB();

    await Item.deleteMany({});
    await User.deleteMany({});

    const user = await User.create({
      name: 'Saka Admin',
      email: 'admin@sakahomes.com',
      password: 'password123',
    });

    await Item.insertMany(
      sampleItems.map((item) => ({
        ...item,
        createdBy: user._id,
      }))
    );

    console.log('Seed complete');
    console.log('Login: admin@sakahomes.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
