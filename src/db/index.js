import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

//(1. DB Connection To Express) better approach to connect mongoDB with express
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)
        console.log(`mongodb connected !! DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB conncetion error ", error);
        process.exit(1)
    }
}

export default connectDB