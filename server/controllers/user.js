import usermodel from "../database/usermodel.js";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.body; // Ensure userId is coming from the correct place
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await usermodel.findById(userId).select("-password"); // Exclude password field

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
