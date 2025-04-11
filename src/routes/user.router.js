import { Router } from 'express'
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// router.route('/register').post(registerUser)  //(1.)
router.route('/register').post(
    //middleware
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
    //controller
    registerUser)  //(2.) insert of middleware(here upload.fields is the middleware) for uploading files from cloudinary by multer. // For single file use single instead of fields // Now we can send images to the register field 

// router.route('/login').post(registerUser)   // --> ref(1)
router.route('/login').post(loginUser)

router.route('/logout').post(verifyJWT,logoutUser) // verifyJWT verify before running of logout the user. In verifyJWT we use next() -- it tells my work is done now the time for next middleware or method(logoutUser)
// example if there is another middleware named anotherJWT in router.route('/logout').post(verifyJWT,anotherJWT,logoutUser) then after complete of verifyJWT next() jump to anotherJWT 

export default router