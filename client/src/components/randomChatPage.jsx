import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaAngleLeft, FaPlus, FaTrash } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import Avatar from './Avatar';
import moment from 'moment';
import { AppContent } from '../context/AppContext';
import '../App.css';

const RandomChatPage = () => {
  const { userdata, socket, onlineUsersCount } = useContext(AppContent);
  const [message, setMessage] = useState({ text: "", imageUrl: "" });
  const [allMessages, setAllMessages] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [randomUser, setRandomUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [popupMessage, setPopupMessage] = useState(""); // New state for popup message
  const [popupVisible, setPopupVisible] = useState(false); // To control visibility of the popup
  const currentMessage = useRef(null);

  useEffect(() => {
    console.log("Current random chat partner:", randomUser);

    if (randomUser && randomUser.name) {
      alert(`You are connected with ${randomUser?.name}`);
    }

    if (socket) {
      // Listen for incoming messages
      socket.on("new-message", (chatRoomId, newMessages) => {
        if (newMessages.some(msg => msg.receiverId === userdata?._id || msg.senderId === userdata?._id)) {
          setAllMessages(newMessages);
        }
      });

      // Listen for status updates
      socket.on("statusUpdate", (status) => {
        if (randomUser?._id === status.userId) {
          setRecipientStatus(status.status);
        }
      });

      // Listen for when a random chat starts
      socket.on("chat-started", (chatRoomId, partner) => {
        console.log("Chat started with user:", partner);
        setRandomUser(partner);
        setChatStarted(true);
        setRecipientStatus("Online");
      });

      // Listen for when a chat ends
      socket.on("chat-ended", () => {
        console.log("Chat ended");
        setChatStarted(false);
        setRecipientStatus("Offline");
        setRandomUser(null);

        // Set the popup message and display it
        setPopupMessage(`${randomUser?.username} left the chat`);
        setPopupVisible(true);

        // Hide the popup after 3 seconds
        setTimeout(() => {
          setPopupVisible(false);
        }, 3000);
      });

      // Listen for typing status
      socket.on("typing", (isTyping) => {
        setIsTyping(isTyping);
      });
    }

    return () => {
      if (socket) {
        socket.off("new-message");
        socket.off("statusUpdate");
        socket.off("chat-started");
        socket.off("chat-ended");
        socket.off("typing");
      }
    };
  }, [socket, userdata, randomUser]);

  const handleStartChat = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setChatStarted(true);
    }, 2000);

    if (socket) {
      console.log("Emitting start-chat event with user ID:", userdata._id);
      socket.emit("start-chat", userdata._id);
    }
  };

  const handleEndChat = () => {
    setChatStarted(false);
    if (socket) {
      socket.emit("end-chat", userdata._id);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatStarted) {
      console.log("Chat not started yet!");
      return;
    }

    if (message.text || message.imageUrl) {
      if (!randomUser || !randomUser._id) {
        console.error('Random user or receiverId is undefined!');
        return;
      }

      const newMessage = {
        senderId: userdata?._id,
        receiverId: randomUser._id,
        text: message.text,
        imageUrl: message.imageUrl,
        createdAt: new Date().toISOString(),
      };

      const chatRoomId = [userdata._id, randomUser._id].sort().join('-');

      if (socket) {
        console.log("Emitting message:", newMessage);
        socket.emit("send-message", chatRoomId, newMessage);
      }

      setAllMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage({ text: "", imageUrl: "" });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size is too large. Please upload a file under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMessage((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file.');
    }
  };

  const handleClearChat = () => {
    setAllMessages([]);
  };

  return (
    <div className="h-screen flex flex-col text-white bg-[url('../assets/bg.jpg')] bg-cover bg-center bg-no-repeat relative overflow-hidden">
      <header className="sticky top-0 h-16 bg-[#1A1A1A] flex justify-between items-center px-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="lg:hidden text-white hover:text-[#E74C3C] transition-colors duration-300">
            <FaAngleLeft size={25} />
          </Link>
          <Avatar width={50} height={50} imageUrl={userdata?.profile_pic} />
          <div className="flex items-center">
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold text-lg md:text-base sm:text-sm">{userdata?.name}</h3>
            </div>
            <div className="flex items-center justify-center w-6 h-6 bg-[#36ac32] text-white rounded-full text-xs font-semibold ml-2">
              {onlineUsersCount}
            </div>
            <span className="text-green-400 text-sm ml-1">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleClearChat} className="text-gray-300 hover:text-[#b95246] transition-colors duration-300">
            <FaTrash size={20} />
          </button>
        </div>
      </header>

      {/* Popup for when the user leaves */}
      {popupVisible && (
        <div className="popup-message animate-popup text-white bg-[#333] p-4 text-center fixed top-16 left-1/2 transform -translate-x-1/2 rounded-md shadow-lg">
          {popupMessage}
        </div>
      )}

      {randomUser && chatStarted && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="relative w-20 h-20">
            <Avatar
              width={80}
              height={80}
              imageUrl={randomUser?.profile_pic}
              className="rounded-full border-4 border-[#f2dfdf]"
            />
            {recipientStatus === "Online" && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <p className="text-md font-light mt-2">You are connected with {randomUser?.username}, say hi!</p>
          <div className="mt-4">
            <span className="animate-wave text-4xl" role="img" aria-label="Hand wave emoji">👋</span>
          </div>
        </div>
      )}

      {/* Other sections of the chat */}
      <section className="flex-1 px-4 py-2 overflow-hidden">
        <div className="flex flex-col gap-2 text-sm md:text-sm sm:text-xs" ref={currentMessage}>
          {allMessages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-3xl max-w-[80%] shadow ${msg.senderId === userdata?._id ? 'ml-auto bg-[#0078FF] text-white' : 'bg-[#F4F4F4] text-black'}`}
            >
              {msg.imageUrl && (
                <div className="w-full my-2 flex justify-center">
                  <img
                    src={msg.imageUrl || 'fallback-image.jpg'}
                    className="w-24 h-24 object-contain rounded-lg"
                    alt="Message"
                  />
                </div>
              )}
              <p className="text-white text-sm">{msg.text}</p>
              <p className="text-xs text-gray-300 text-right">{moment(msg.createdAt).format('hh:mm A')}</p>
            </div>
          ))}
          {isTyping && <p className="text-sm text-gray-300">User is typing...</p>}
        </div>
      </section>

      <section className="h-16 bg-[#1A1A1A] flex items-center px-2 sm:px-4 gap-2 shadow-inner w-full">
        <button
          onClick={chatStarted ? handleEndChat : handleStartChat}
          className="w-20 sm:w-24 md:w-32 h-10 rounded-full bg-[#E74C3C] text-white flex-shrink-0 flex items-center justify-center font-semibold transition-colors duration-300 hover:bg-[#C0392B]"
        >
          {isSearching ? (
            <div className="loader border-t-2 border-white border-solid rounded-full w-4 h-4 animate-spin"></div>
          ) : chatStarted ? (
            "End Chat"
          ) : (
            "Start Chat"
          )}
        </button>
        <form className="flex-1 flex items-center gap-1 relative w-full" onSubmit={handleSendMessage}>
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
            className="flex-1 p-2 sm:p-3 pl-10 sm:pl-12 rounded-full bg-[#2A2A2A] text-white outline-none border border-gray-600 w-full"
          />
          <button
            type="submit"
            className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-full bg-[#E74C3C] hover:bg-[#C0392B] transition-colors duration-300 flex-shrink-0"
          >
            <IoMdSend size={20} className="text-white" />
          </button>
        </form>
      </section>
    </div>
  );
};

export default RandomChatPage;
