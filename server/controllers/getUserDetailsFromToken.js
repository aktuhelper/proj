import jwt from 'jsonwebtoken';
import usermodel from "../database/usermodel.js";

// This function fetches user details based on the token
 const getUserDetailsFromToken = async (token) => {
    try {
        // Decode token and get userId (e.g., using jwt.verify if you're using JWT tokens)
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assuming you're using JWT

        if (!decoded || !decoded.userId) {
            throw new Error("Invalid token");
        }

        const user = await usermodel.findById(decoded.userId).select("-password");

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export default getUserDetailsFromToken
