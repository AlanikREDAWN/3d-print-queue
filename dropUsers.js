const mongoose = require('mongoose');
require('dotenv').config();

async function dropUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.collection('users').drop();
  console.log('Dropped users collection');
  mongoose.disconnect();
}

dropUsers();
