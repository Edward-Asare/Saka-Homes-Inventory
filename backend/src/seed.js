require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');

const seed = async () => {
  try {
    await connectDB();

    // Clear inventory so you can add your own data
    await Item.deleteMany({});
    await User.deleteMany({});

    await User.create({
      name: 'Saka Admin',
      email: 'admin@sakahomes.com',
      password: 'password123',
    });

    console.log('Seed complete — inventory is empty');
    console.log('Login: admin@sakahomes.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
