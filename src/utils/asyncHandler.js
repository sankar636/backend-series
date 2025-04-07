// it will create a method and exports it 
// (1.)ASYNC HANDLER USING PROMICESS
const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }  
}


// (2.)ASYNC HANDLER USING TRY AND CATCH
// const asyncHandler = () => {}
// const asyncHandler = (fn) => {}
// const asyncHandler = (fn) => {() => {}}
// const asyncHandler = (fn) => () => {}

// const asyncHandler = (fn) => async (req, res, next) => { // higher order function take argument as a function
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: true,
//             message: error.message
//         })
//     }
// }


export { asyncHandler }