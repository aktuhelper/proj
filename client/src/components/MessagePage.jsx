import { useEffect, useState, useRef, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { FaAngleLeft, FaPlus, FaTrash, FaUserPlus } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import Avatar from './Avatar';
import moment from 'moment';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
const MessagePage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { recipient } = location.state || {};  // Get the recipient from the state
  const { socket, userdata, backendUrl } = useContext(AppContent);

  const [message, setMessage] = useState({ text: "", imageUrl: "" });
  const [allMessages, setAllMessages] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState("");
  const [showFriendDialog, setShowFriendDialog] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);  // For loading state
  const currentMessage = useRef(null);

  const [conversationId, setConversationId] = useState(null); // Track conversation ID
  const [errorMessage, setErrorMessage] = useState(""); // Error message state
  const [friendStatus, setFriendStatus] = useState("");  // Track if users are already friends

  const fetchConversationId = async () => {
    if (!userId || !recipient?._id) return;

    try {
      const response = await axios.get(`${backendUrl}/api/conv/${userId}/${recipient._id}`);
      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);  // Set the conversation ID in state
      } else {
        console.error("Conversation not found");
      }
    } catch (error) {
      console.error("Error fetching conversation ID:", error);
    }
  };

  useEffect(() => {
    if (!socket || !userId || !recipient?._id) return;

    socket.emit('message-page', userId);  // Fetch previous conversation when the page loads

    // Set up listeners once
    const handleMessageUser = (data) => {
      setRecipientStatus(data.online ? "Online" : "Offline");
    };

    const handleMessage = (messages) => {
      setAllMessages(messages);
    };

    const handleReceiveMessage = (newMessage) => {
      if (
        (newMessage.receiverId === userId && newMessage.senderId === recipient?._id) ||
        (newMessage.senderId === userId && newMessage.receiverId === recipient?._id)
      ) {
        setAllMessages((prev) => {
          if (!prev.some(msg => msg._id === newMessage._id)) {
            return [...prev, newMessage];
          }
          return prev;
        });
        fetchConversationId();  // Fetch the conversation ID immediately after receiving a message
      }
    };

    const handleOnlineUsers = (onlineUsers) => {
      setRecipientStatus(onlineUsers.includes(recipient?._id) ? "Online" : "Offline");
    };

    const handleFriendRequestResponse = (data) => {
      if (data.status === 'sent' || data.status === 'accepted') {
        setFriendRequestSent(true);  // Friend request sent/accepted
      } else if (data.status === 'rejected') {
        setFriendRequestSent(false);  // Friend request rejected
      } else if (data.error) {
        setErrorMessage(data.error);  // Show error message from server
      }
    };

    socket.on('message-user', handleMessageUser);
    socket.on('message', handleMessage);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('friendRequestResponse', handleFriendRequestResponse);

    return () => {
      socket.off('message-user', handleMessageUser);
      socket.off('message', handleMessage);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('friendRequestResponse', handleFriendRequestResponse);
    };
  }, [socket, userId, recipient?._id]);  // Ensure only necessary dependencies are included

  useEffect(() => {
    fetchConversationId();  // Fetch the conversation ID initially

    if (currentMessage.current) {
      currentMessage.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [allMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.text.trim() && !message.imageUrl) return;  // Prevent sending if the message is empty or just whitespace
    if (!userdata?._id) return;

    const tempMessageId = Date.now().toString();  // Using timestamp-based ID

    const newMessage = {
      _id: tempMessageId,
      senderId: userdata._id,  // Sender is the logged-in user
      receiverId: userId,  // Receiver is the intended user
      text: message.text,
      imageUrl: message.imageUrl,
      createdAt: new Date().toISOString(),
    };

    setAllMessages((prev) => [...prev, newMessage]);

    socket.emit('newMessage', newMessage, (serverResponse) => {
      if (serverResponse?.success) {
        setAllMessages(serverResponse.messages);  // Update messages with the latest from the server
        socket.emit('fetchConversations');  // Fetch the latest conversations from the server
        fetchConversationId();  // Fetch the conversation ID immediately after sending a message
      } else {
        setAllMessages((prev) => prev.filter(msg => msg._id !== tempMessageId));  // Remove temporary message if sending failed
      }
    });

    setMessage({ text: "", imageUrl: "" });
  };

  const handleSendImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoadingImage(true); // Start loading state

    const reader = new FileReader();
    reader.onloadend = () => {
      setMessage((prev) => ({ ...prev, imageUrl: reader.result }));
      setIsLoadingImage(false); // End loading state
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await axios.delete(`${backendUrl}/api/auth/deleteConversation/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${userdata.token}`,
        },
      });

      if (response.data.success) {
        alert('Conversation deleted successfully.');
        setAllMessages([]); // Clear the messages after deleting the conversation
        setConversationId(null); // Clear conversation ID
      } else {
        alert('An error occurred while deleting the conversation.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('An error occurred while deleting the conversation.');
    }
  };

  const handleSendFriendRequest = () => {
    if (!userdata?._id) return;

    if (friendStatus === "You are already friends.") {
      // If they are already friends, show the message in the dialog
      setShowFriendDialog(true);
      return;
    }

    socket.emit('send-friend-request', userdata._id, userId);
    setFriendRequestSent(true);  // Optimistic update
  };

  const handleCloseDialog = () => {
    setShowFriendDialog(false);
    setFriendRequestSent(false);
    setErrorMessage(""); // Clear the error message when closing the dialog
  };

  const handleInputChange = (e) => {
    setMessage({ ...message, text: e.target.value });
  };

  const handleCheckFriendStatus = async () => {
    if (!userdata || !userdata._id) {
      console.log("User data is not available.");
      return; // Stop execution if userdata or userdata._id is missing
    }

    try {
      const response = await axios.get(
        `${backendUrl}/api/user/${userdata._id}/friend-status/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${userdata.token}`,
          },
        }
      );
      if (response.data.isAlreadyFriends) {
        setFriendStatus("You are already friends.");
        setFriendRequestSent(false);
      } else {
        setFriendStatus("");
      }
    } catch (error) {
      console.log("Error checking friend status:", error);
    }
  };

  // Ensure effect runs when userdata or userId changes

  return (
    <div className="h-screen flex flex-col text-white bg-[url('../assets/bg.jpg')] bg-cover bg-center bg-no-repeat relative">
      {/* Header */}
      <header className="sticky top-0 h-16 bg-[#1A1A1A] flex justify-between items-center px-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="lg:hidden text-white hover:text-green-400 transition">
            <FaAngleLeft size={25} />
          </Link>
          <Avatar width={50} height={50} imageUrl={recipient?.profile_pic} />
          <div>
            <h3 className="font-semibold text-lg">{recipient?.name || "User"}</h3>
            <p className={`text-sm ${recipientStatus === "Online" ? "text-green-400" : "text-red-500"}`}>
              {recipientStatus}
            </p>
          </div>
        </div>

        {/* Icons */}
        <div className="flex gap-3">
          {/* Add Friend Button */}
          <button className="text-gray-300 hover:bg-white/20 rounded-full p-2 transition" onClick={() => setShowFriendDialog(true)}>
          <FaUserPlus size={20} onClick={handleCheckFriendStatus} />
          </button>

          {/* Delete Button */}
          <button className="text-gray-300 hover:bg-white/20 rounded-full p-2 transition" onClick={handleDeleteConversation}>
            <FaTrash size={20} />
          </button>

          <button className="text-gray-300 hover:text-gray-100 transition">
            <HiDotsVertical size={22} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <section className="flex-1 overflow-y-scroll px-4 py-2">
        <div className="flex flex-col gap-2">
          {allMessages.map((msg, index) => (
            <div key={msg._id || index} className={`p-3 rounded-3xl min-w-[120px] min-h-[40px] shadow-lg ${msg.senderId === userdata?._id ? "ml-auto bg-[#0078FF] text-white max-w-[45%]" : "mr-auto bg-[#1A1A1A] text-white max-w-[50%]"}`}>
              {msg.imageUrl && <img src={msg.imageUrl} className="max-w-full max-h-80 w-auto object-contain rounded-lg" alt="Message" />}
              <p className="text-sm break-words">{msg.text}</p>
              <p className="text-xs text-gray-200 text-right">{moment(msg.createdAt).format('hh:mm A')}</p>
            </div>
          ))}
          <div ref={currentMessage}></div>
        </div>
      </section>

      {/* Message Input */}
      <section className="h-16 bg-[#1A1A1A] flex items-center px-4 gap-3 shadow-inner">
        <form className="flex-1 flex items-center gap-2 relative" onSubmit={handleSendMessage}>
          <label htmlFor="image-upload" className="absolute left-3 text-gray-400 cursor-pointer hover:text-white">
            <FaPlus size={20} />
          </label>
          <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleSendImage} />
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-2 sm:p-3 pl-10 sm:pl-12 rounded-full bg-[#2A2A2A] text-white outline-none border border-gray-600 w-full"
            value={message.text}
            onChange={handleInputChange}
          />
          <button type="submit" className="text-green-400 hover:text-green-300">
            <IoMdSend size={28} />
          </button>
        </form>
      </section>

      {/* Loading State for Image */}
      {isLoadingImage && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black opacity-50 flex items-center justify-center">
          <span className="text-white">Loading...</span>
        </div>
      )}

      {/* Friend Request Dialog */}
      {showFriendDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-[#1A1A1A] p-6 rounded-lg text-center w-80">
            <div className="flex justify-center">
              <Avatar width={80} height={80} imageUrl={recipient?.profile_pic} />
            </div>

            <h3 className="text-lg font-semibold mt-3">{recipient?.name}</h3>

            <div className="mt-4">
              {friendRequestSent ? (
                <div>
                  <p className="text-gray-300 text-lg font-semibold">
                    Friend request sent to {recipient?.name}!
                  </p>
                  <button
                    className="mt-4 px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    onClick={handleCloseDialog}
                  >
                    OK
                  </button>
                </div>
              ) : friendStatus === "You are already friends." ? (
                <div>
                  <p className="text-gray-300 text-lg font-semibold">
                    You are already friends with {recipient?.name}.
                  </p>
                  <button
                    className="mt-4 px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    onClick={handleCloseDialog}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex justify-center gap-4 mt-5">
                  <button
                    className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    onClick={handleSendFriendRequest}
                  >
                    Add Friend
                  </button>
                  <button
                    className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    onClick={() => setShowFriendDialog(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Display Error Message */}
            {errorMessage && (
              <div className="text-red-500 mt-3">
                <p>{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePage;
