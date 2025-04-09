import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'

const router = Router()

// router.route('/register').post(registerUser)  //(1.)
router.route('/register').post(
    upload.fields([
        {
            name:"avatar",  // frontend name must be avatar
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), 
    registerUser)  //(2.) insert of middleware for uploading files from cloudinary by multer. // For single file use single instead of fields // Now we can send images to the register field 

// router.route('/login').post(registerUser)   // --> ref(1)


export default router