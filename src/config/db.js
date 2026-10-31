import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbName = process.env.DB_NAME || 'boighuri';
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName,
    });
    console.log(`🍃 MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
