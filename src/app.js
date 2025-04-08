import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()


// cors configration  
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// middleware configration 
app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true,
    limit: "16kb"
}))
// extended: true	Allows nested object parsing (qs lib)
// limit: "16kb"	Sets max size for form data

app.use(express.static("public"))
// express.static("public")	Serves files in public/ folder

app.use(cookieParser())



// routes import 

import userRouter from './routes/user.router.js'

// routes declaration 
app.use('/api/v1/user', userRouter)
//it is --> http://8000/api/v1/user/register    (/register from user.router.js)

// similarly  ref(1)
// app.use('/user', userRouter)
// it is  --> http://8000/user/login  (/login from user.router.js)

export { app }