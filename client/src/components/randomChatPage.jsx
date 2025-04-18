import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaAngleLeft, FaUserPlus, FaPlus, FaTrash } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import Avatar from './Avatar';
import moment from 'moment';
import { AppContent } from '../context/AppContext';
import '../App.css';
import axios from 'axios';

const RandomChatPage = () => {
  const { userdata, socket, onlineUsersCount, backendUrl } = useContext(AppContent);

  const [message, setMessage] = useState({ text: "", imageUrl: "" });
  const [allMessages, setAllMessages] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [randomUser, setRandomUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);

  // Friend request management
  const [showFriendDialog, setShowFriendDialog] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendStatus, setFriendStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (randomUser?.name) {
      alert(`You are connected with ${randomUser.name}`);
    }

    if (socket) {
      socket.on("new-message", (chatRoomId, newMessages) => {
        if (newMessages.some(msg => msg.receiverId === userdata?._id || msg.senderId === userdata?._id)) {
          setAllMessages(newMessages);
        }
      });

      socket.on("statusUpdate", (status) => {
        if (randomUser?._id === status.userId) {
          setRecipientStatus(status.status);
        }
      });

      socket.on("chat-started", (chatRoomId, partner) => {
        setRandomUser(partner);
        setChatStarted(true);
        setRecipientStatus("Online");
      });

      socket.on("chat-ended", () => {
        const leftUser = randomUser?.username;
        setChatStarted(false);
        setRecipientStatus("Offline");
        setRandomUser(null);
        setPopupMessage(`${leftUser} left the chat`);
        setPopupVisible(true);
        setTimeout(() => setPopupVisible(false), 3000);
      });

      socket.on("typing", setIsTyping);

      socket.on('friendRequestResponse', (data) => {
        if (data.status === 'sent' || data.status === 'accepted') {
          setFriendRequestSent(true);
        } else if (data.status === 'rejected') {
          setFriendRequestSent(false);
        } else if (data.error) {
          setErrorMessage(data.error);
        }
      });
    }

    return () => {
      socket?.off("new-message");
      socket?.off("statusUpdate");
      socket?.off("chat-started");
      socket?.off("chat-ended");
      socket?.off("typing");
      socket?.off("friendRequestResponse");
    };
  }, [socket, userdata, randomUser]);

  useEffect(() => {
    messageContainerRef.current?.scrollTo(0, messageContainerRef.current.scrollHeight);
  }, [allMessages, isTyping]);

  const handleStartChat = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setChatStarted(true);
    }, 2000);
    socket?.emit("start-chat", userdata._id);
  };

  const handleEndChat = () => {
    setChatStarted(false);
    socket?.emit("end-chat", userdata._id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatStarted || (!message.text && !message.imageUrl)) return;

    const newMessage = {
      senderId: userdata?._id,
      receiverId: randomUser.userId,
      text: message.text,
      imageUrl: message.imageUrl,
      createdAt: new Date().toISOString(),
    };

    const chatRoomId = [userdata._id, randomUser.userId].sort().join('-');
    socket.emit("send-message", chatRoomId, newMessage);
    setAllMessages(prev => [...prev, newMessage]);
    setMessage({ text: "", imageUrl: "" });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size is too large. Please upload under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMessage(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearChat = () => setAllMessages([]);

  const handleSendFriendRequest = () => {
    if (!userdata?._id || !randomUser?.userId) return;

    if (friendStatus === "You are already friends.") {
      setShowFriendDialog(true);
      return;
    }

    socket.emit('send-friend-request', userdata._id, randomUser.userId);
    setFriendRequestSent(true);
  };

  const handleCheckFriendStatus = async () => {
    if (!userdata || !userdata._id || !randomUser?.userId) return;

    try {
      const res = await axios.get(`${backendUrl}/api/user/${userdata._id}/friend-status/${randomUser.userId}`, {
        headers: {
          Authorization: `Bearer ${userdata.token}`,
        }
      });
      if (res.data.isAlreadyFriends) {
        setFriendStatus("You are already friends.");
        setFriendRequestSent(false);
      } else {
        setFriendStatus("");
      }
    } catch (error) {
      console.log("Friend status error:", error);
    }
  };

  const handleOpenFriendDialog = () => {
    handleCheckFriendStatus();
    setShowFriendDialog(true);
  };

  const handleCloseDialog = () => {
    setShowFriendDialog(false);
    setFriendRequestSent(false);
    setFriendStatus("");
    setErrorMessage("");
  };

  return (
    <div className="h-screen flex flex-col text-white bg-[url('../assets/bg.jpg')] bg-cover bg-center bg-no-repeat relative overflow-hidden">
      {/* HEADER */}
      <header className="sticky top-0 h-16 bg-[#1A1A1A] flex justify-between items-center px-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="lg:hidden text-white hover:text-[#E74C3C] transition">
            <FaAngleLeft size={25} />
          </Link>
          <Avatar width={50} height={50} imageUrl={userdata?.profile_pic} />
          <div className="flex items-center">
            <h3 className="font-semibold text-lg">{userdata?.name}</h3>
            <div className="ml-2 flex items-center justify-center w-6 h-6 bg-green-600 rounded-full text-sm font-semibold">
              {onlineUsersCount}
            </div>
            <span className="text-green-400 ml-1 text-sm">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-300 hover:bg-white/20 rounded-full p-2" onClick={handleOpenFriendDialog}>
            <FaUserPlus size={20} />
          </button>
          <button onClick={handleClearChat} className="text-gray-300 hover:text-red-500 transition">
            <FaTrash size={20} />
          </button>
        </div>
      </header>

      {/* Friend Request Dialog */}
      {showFriendDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="bg-[#1A1A1A] p-6 rounded-lg text-center w-80">
            <div className="flex justify-center">
              <Avatar width={80} height={80} imageUrl={randomUser?.profile_pic} />
            </div>
            <h3 className="text-lg font-semibold mt-3">{randomUser?.username}</h3>
            <div className="mt-4">
              {friendRequestSent ? (
                <>
                  <p className="text-gray-300 text-lg">Friend request sent to {randomUser?.username}!</p>
                  <button className="mt-4 px-5 py-2 bg-red-500 text-white rounded-md" onClick={handleCloseDialog}>OK</button>
                </>
              ) : friendStatus === "You are already friends." ? (
                <>
                  <p className="text-gray-300 text-lg">You are already friends with {randomUser?.username}.</p>
                  <button className="mt-4 px-5 py-2 bg-red-500 text-white rounded-md" onClick={handleCloseDialog}>OK</button>
                </>
              ) : (
                <>
                  {errorMessage && <p className="text-red-400 mb-2">{errorMessage}</p>}
                  <div className="flex justify-center gap-4 mt-4">
                    <button className="px-5 py-2 bg-blue-500 text-white rounded-md" onClick={handleSendFriendRequest}>Add Friend</button>
                    <button className="px-5 py-2 bg-red-500 text-white rounded-md" onClick={handleCloseDialog}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Message */}
      {popupVisible && (
        <div className="popup-message animate-popup text-white bg-[#333] p-4 text-center fixed top-16 left-1/2 transform -translate-x-1/2 rounded-md shadow-lg z-20">
          {popupMessage}
        </div>
      )}

      {/* Chat Header */}
      {randomUser && chatStarted && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="relative w-20 h-20">
            <Avatar width={80} height={80} imageUrl={randomUser?.profile_pic} />
            {recipientStatus === "Online" && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <p className="text-md mt-2">You are connected with {randomUser?.username}, say hi! 👋</p>
        </div>
      )}

      {/* Chat Messages */}
      <section className="flex-1 overflow-y-scroll px-4 py-2" ref={messageContainerRef}>
        <div className="flex flex-col gap-2">
          {allMessages.map((msg, index) => (
            <div key={msg._id || index} className={`p-3 rounded-3xl shadow-lg ${msg.senderId === userdata?._id ? "ml-auto bg-[#0078FF]" : "mr-auto bg-[#1A1A1A]"} max-w-[70%]`}>
              {msg.imageUrl && <img src={msg.imageUrl} alt="msg" className="max-w-full max-h-80 rounded-lg mb-2" />}
              <p className="text-sm break-words">{msg.text}</p>
              <p className="text-xs text-gray-100 text-right mt-1">{moment(msg.createdAt).format('hh:mm A')}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Input */}
      <section className="h-20  px-2 py-2 flex items-center gap-2 shadow-inner">
  <div className="flex-shrink-0">
    <button
      onClick={chatStarted ? handleEndChat : handleStartChat}
      className="min-w-[100px] h-12 px-4 flex items-center justify-center rounded-full bg-[#E74C3C] text-white font-semibold hover:bg-[#C0392B] transition"
    >
      {isSearching ? (
        <div className="loader border-t-2 border-white border-solid rounded-full w-5 h-5 animate-spin" />
      ) : (
        chatStarted ? "End Chat" : "Start Chat"
      )}
    </button>
  </div>

  <form
    className="flex items-center gap-2 sm:w-full w-full relative flex-wrap"
    onSubmit={(e) => handleSendMessage(e)} // Prevent form default behavior and manually call handleSendMessage
  >
    <label className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer">
      <FaPlus size={18} className="text-white" />
      <input type="file" className="hidden" onChange={handleFileUpload} />
    </label>

    <input
      type="text"
      value={message.text}
      onChange={(e) => {
        setMessage({ ...message, text: e.target.value });
        socket.emit("typing", e.target.value.length > 0);
      }}
      placeholder="Type a message..."
      className="flex-1 p-3 pl-10 rounded-full bg-[#2A2A2A] text-white outline-none border border-gray-600 sm:w-full w-[calc(100%-3rem)]" // Full width on small screens
    />

    <button
      type="submit"
      className={`w-12 h-12 flex items-center justify-center rounded-full ${message.text || message.imageUrl ? 'bg-[#E74C3C] hover:bg-[#C0392B]' : 'bg-gray-600 cursor-not-allowed'}`}  // Disable button if message is empty
      disabled={!message.text && !message.imageUrl}  // Disable if both message and image are empty
    >
      <IoMdSend size={20} className="text-white" />
    </button>
  </form>
</section>




    </div>
  );
};

export default RandomChatPage;
