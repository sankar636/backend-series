// require('dotenv').config({path: './.env'}); // this is not improved version of writing this code

// import mongoose from 'mongoose';
import connectDB from './db/index.js';
import express from 'express'
const app = express()

import dotenv from "dotenv";
dotenv.config({
    path: './.env'
}); // this is not improved version of writing this code
// console.log(process.env);

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000,() => {
        console.log(`MongoDB connected successfully on the port ${process.env.PORT || 8000}`);
        
    })
})
.catch((error) => {
    console.log("MongoDB connection failed !!!", error)
})







/* (2. DB Connection To Express) IIFE
// import { DB_NAME } from './constants';
import express from 'express';
const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // listeners
        app.on("error", () => {
            console.log("ERROR: ",error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port:  ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR: ", error);
        throw error;        
    }
})()

*/
