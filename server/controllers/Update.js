import usermodel from "../database/usermodel.js";

async function updateUserDetails(req, res) {
    try {
        console.log("Received Data:", req.body); // Debugging log

        const { userId, name, profile_pic } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required", error: true });
        }
        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Name cannot be empty", error: true });
        }

        const updatedUser = await usermodel.findByIdAndUpdate(
            userId, 
            { name: name.trim(), profile_pic }, 
            { new: true, select: "-password" } // Exclude password from response
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        console.log("Updated User:", updatedUser); // Debugging log

        return res.json({
            message: "User updated successfully",
            data: updatedUser,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error",
            error: true
        });
    }
}

export default updateUserDetails;
