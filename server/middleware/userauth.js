import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;  // or req.headers.authorization depending on how the token is passed
  
  if (!token) {
    return res.json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    // Verify the token with the secret from environment variables
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    
    if (tokenDecode.id) {
      req.body.userId = tokenDecode.id;  // Attach the decoded user ID to request body
      return next();  // Proceed to the next middleware/route handler
    } else {
      return res.json({ success: false, message: "Not Authorized. Login Again" });
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.json({ success: false, message: 'Token has expired. Please login again' });
    }
    return res.json({ success: false, message: 'Invalid token signature' });
  }
};

export default userAuth;
