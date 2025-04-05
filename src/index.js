// require('dotenv').config({path: './.env'}); // this is not improved version of writing this code

import mongoose from 'mongoose';
import connectDB from './db/index.js';


import dotenv from "dotenv";
dotenv.config({
    path: './.env'
}); // this is not improved version of writing this code


/* (1.) IIFE
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

connectDB()