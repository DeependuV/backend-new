const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler2 = (fn)  => { () => {} }
// this and the function down below are the same

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {

//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
// this one is better

// two types more to Write
// const asyncHandler = () => {}
// const asyncHnadler = (func) => async () => {}
