
// const jwt = require('jsonwebtoken');
// const response = require('../utils/responseHandler');


// const  authMiddleware = (req,res,next) =>{
//     const authToken = req?.cookies?.auth_token;
//     if(!authToken) return response(res,401, 'Authentication required. please provide a token');

//     try {
//          const decode = jwt.verify(authToken,process.env.JWT_SECRET);
//          req.user = decode;
//          next();
//     } catch (error) {
//         console.error(error)
//         return response(res,401, 'Invalid token or expired. Please try again')
//     }
// }

// module.exports = authMiddleware;



const jwt = require('jsonwebtoken');
const response = require('../utils/responseHandler'); // ✅ make sure spelling matches your file!

// ✅ Basic JWT auth middleware
const authMiddleware = (req, res, next) => {
  const authToken = req?.cookies?.auth_token;

  if (!authToken) {
    return response(res, 401, 'Authentication required. Please provide a token.');
  }

  try {
    const decode = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decode; // now req.user.role should exist if included in token payload
    next();
  } catch (error) {
    console.error(error);
    return response(res, 401, 'Invalid token or expired. Please try again.');
  }
};

// ✅ Add a new verifyAdmin helper to use in routes!
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return response(res, 403, 'Forbidden: Admins only!');
  }
};

module.exports = {
  authMiddleware,
  verifyAdmin,
};
