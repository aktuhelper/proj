import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { FaAngleLeft, FaPlus, FaUserPlus, FaTrash } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import Avatar from './Avatar';
import moment from 'moment';
import { AppContent } from '../context/AppContext';

const RandomChatPage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { recipient } = location.state || {}; // In case the recipient is passed from another component
  const { socket, userdata, randomChatPartner } = useContext(AppContent);

  const [message, setMessage] = useState({ text: "", imageUrl: "" });
  const [allMessages, setAllMessages] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState("Offline");
  const [isSearching, setIsSearching] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const currentMessage = useRef(null);

  // Ensure the randomChatPartner is available or use recipient from state
  const currentPartner = randomChatPartner || recipient;

  useEffect(() => {
    // Debug logs for randomChatPartner and recipient
    console.log("Random Chat Partner:", randomChatPartner);  // Debug log
    console.log("Recipient from location:", recipient);  // Debug log

    if (!currentPartner) {
      console.error('No random chat partner or recipient found!');
      return; // If no partner is found, exit early
    }

    // Scroll to the latest message
    if (currentMessage.current) {
      currentMessage.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // Listen for incoming messages
    if (socket) {
      socket.on("newMessage", (newMessage) => {
        if (
          newMessage.receiverId === userdata?._id || 
          newMessage.senderId === userdata?._id
        ) {
          setAllMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });

      // Listen for status updates of the random chat partner
      socket.on("statusUpdate", (status) => {
        if (currentPartner?._id === status.userId) {
          setRecipientStatus(status.status);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("newMessage");
        socket.off("statusUpdate");
      }
    };
  }, [socket, userdata, currentPartner]);

  const handleStartChat = () => {
    if (!currentPartner) {
      console.error('No random chat partner or recipient available to start a chat!');
      alert('Please try again, no partner found.');
      return;
    }

    console.log("Current partner:", currentPartner);  // Debug log

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setChatStarted(true);
    }, 2000); // Simulate the time taken to start the chat
  };

  const handleEndChat = () => {
    setChatStarted(false); // End chat
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatStarted) {
      console.log("Chat not started yet!");
      return; // Prevent sending message if chat hasn't started
    }

    if (message.text || message.imageUrl) {
      if (!currentPartner) {
        console.error('No random chat partner found!');
        return; // Prevent sending message if no partner exists
      }

      const newMessage = {
        senderId: userdata?._id,
        receiverId: currentPartner._id, // Send message to the current chat partner
        text: message.text,
        imageUrl: message.imageUrl,
        createdAt: new Date().toISOString(),
      };

      if (socket) {
        socket.emit("randomChatMessage", newMessage); // Emit the new message to the server
      }

      setAllMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage({ text: "", imageUrl: "" }); // Clear the input fields after sending
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
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
    setAllMessages([]); // Clear the chat history
  };

  return (
    <div className="h-screen flex flex-col text-white bg-[url('../assets/bg.jpg')] bg-cover bg-center bg-no-repeat relative overflow-hidden">
      <header className="sticky top-0 h-16 bg-[#1A1A1A] flex justify-between items-center px-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="lg:hidden text-white hover:text-[#E74C3C] transition-colors duration-300">
            <FaAngleLeft size={25} />
          </Link>
          <Avatar width={50} height={50} imageUrl={currentPartner?.profile_pic} />
          <div>
            <h3 className="font-semibold text-lg md:text-base sm:text-sm">{currentPartner?.name || "User"}</h3>
            <p className={`text-sm ${recipientStatus === "Online" ? "text-green-400" : "text-red-500"}`}>
              {recipientStatus}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-[#E74C3C] transition-colors duration-300">
            <FaUserPlus size={23} />
          </button>
          <button onClick={handleClearChat} className="text-gray-300 hover:text-[#b95246] transition-colors duration-300">
            <FaTrash size={20} />
          </button>
          <button className="text-gray-300 hover:text-gray-100 transition-colors duration-300">
            <HiDotsVertical size={22} />
          </button>
        </div>
      </header>

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
        </div>
      </section>

      <section className="h-16 bg-[#1A1A1A] flex items-center px-2 sm:px-4 gap-2 shadow-inner w-full">
        <button 
          onClick={chatStarted ? handleEndChat : handleStartChat} 
          className="w-20 sm:w-24 md:w-32 h-10 rounded-full bg-[#E74C3C] text-white flex-shrink-0 flex items-center justify-center font-semibold transition-colors duration-300 hover:bg-[#C0392B]">
          {isSearching ? <div className="loader border-t-2 border-white border-solid rounded-full w-4 h-4 animate-spin"></div> : chatStarted ? "End Chat" : "Start Chat"}
        </button>
        <form className="flex-1 flex items-center gap-1 relative w-full" onSubmit={handleSendMessage}>
          <label className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer">
            <FaPlus size={18} className="text-white" />
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
          <input
            type="text"
            value={message.text}
            onChange={(e) => setMessage({ ...message, text: e.target.value })}
            placeholder="Type a message..."
            className="flex-1 p-2 sm:p-3 pl-10 sm:pl-12 rounded-full bg-[#2A2A2A] text-white outline-none border border-gray-600 w-full"
          />
          <button type="submit" className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-full bg-[#E74C3C] hover:bg-[#C0392B] transition-colors duration-300 flex-shrink-0">
            <IoMdSend size={20} className="text-white" />
          </button>
        </form>
      </section>
    </div>
  );
};

export default RandomChatPage;
