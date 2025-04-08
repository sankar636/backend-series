import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req,res) => {
     res.status(200).json({
        message: "sankar"
    })
})

//ref(1)
// const login = asyncHandler(async (req,res,next) => {
// })
export {
    registerUser
}