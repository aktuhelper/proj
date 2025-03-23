// Routes/friendRequestRoute.js
import express from 'express';
import mongoose from 'mongoose';
import FriendRequest from '../database/FriendRequestModel.js'; // Import the FriendRequest model
import UserModel from '../database/usermodel.js'; // Import the User model correctly

const router = express.Router();

// Route to get all friend requests for a user (both sent and received)
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        // Check if the user exists in the database
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all sent friend requests for the user
        const sentRequests = await FriendRequest.find({ sender: userId })
            .populate('receiver', 'name profile_pic'); // Populate receiver with name and profile_pic

        // Fetch all received friend requests for the user
        const receivedRequests = await FriendRequest.find({ receiver: userId })
            .populate('sender', 'name profile_pic'); // Populate sender with name and profile_pic

        // Combine sent and received requests
        const allRequests = [...sentRequests, ...receivedRequests];

        // Send the list of friend requests to the client
        res.status(200).json({ friendRequests: allRequests });

    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ message: 'Error fetching friend requests' });
    }
});

export default router;
