import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { FaAngleLeft, FaImage, FaPlus } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import Avatar from './Avatar';
import moment from 'moment';
import { AppContent } from '../context/AppContext';

const MessagePage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { recipient } = location.state || {};
  const { socket, userdata } = useContext(AppContent);

  const [message, setMessage] = useState({ text: "", imageUrl: "" });
  const [allMessages, setAllMessages] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState("Offline");
  const [openImageUpload, setOpenImageUpload] = useState(false);
  const currentMessage = useRef(null);

  useEffect(() => {
    if (currentMessage.current) {
      currentMessage.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [allMessages]);

  useEffect(() => {
    if (socket) {
      socket.emit('message-page', userId);
      socket.on('message-user', (data) => {
        setRecipientStatus(data.online ? "Online" : "Offline");
      });
      socket.on('message', (messages) => {
        setAllMessages(messages);
      });
      socket.on('onlineUsers', (onlineUsers) => {
        setRecipientStatus(onlineUsers.includes(userId) ? "Online" : "Offline");
      });
      return () => {
        socket.off('message-user');
        socket.off('message');
        socket.off('onlineUsers');
      };
    }
  }, [socket, userId]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessage((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.text || message.imageUrl) {
      const newMessage = {
        senderId: userdata?._id,
        receiverId: userId,
        text: message.text,
        imageUrl: message.imageUrl,
        createdAt: new Date().toISOString(),
      };
      socket.emit('new message', newMessage);
      setAllMessages([...allMessages, newMessage]);
      setMessage({ text: "", imageUrl: "" });
    }
  };

  return (
    <div className="h-screen flex flex-col text-white bg-[url('../assets/bg.jpg')] bg-cover bg-center bg-no-repeat relative">
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
        <button className="text-gray-300 hover:text-gray-100 transition">
          <HiDotsVertical size={22} />
        </button>
      </header>

      <section className="flex-1 overflow-y-scroll px-4 py-2">
        <div className="flex flex-col gap-2" ref={currentMessage}>
          {allMessages.map((msg, index) => (
            <div key={index} className={`p-3 rounded-3xl max-w-[70%] shadow ${msg.senderId === userdata?._id ? "ml-auto bg-emerald-800" : "bg-gray-700"}`}>
              {msg.imageUrl && (
                <div className="w-full my-2 flex justify-center">
                  <img src={msg.imageUrl} className="max-w-full max-h-80 w-auto object-contain rounded-lg" alt="Message" />
                </div>
              )}
              <p className="text-white">{msg.text}</p>
              <p className="text-xs text-gray-300 text-right">{moment(msg.createdAt).format('hh:mm A')}</p>
            </div>
          ))}
        </div>
      </section>

      {message.imageUrl && (
        <div className="absolute bottom-16 right-0 flex justify-center items-center bg-opacity-60 p-4">
          <div className="relative bg-[#1A1A1A] p-3 rounded-lg">
            <IoClose size={30} className="absolute top-2 right-2 cursor-pointer text-red-500" onClick={() => setMessage((prev) => ({ ...prev, imageUrl: "" }))} />
            <img src={message.imageUrl} alt="Upload Preview" className="max-w-[90%] max-h-96 object-contain rounded-lg" />
          </div>
        </div>
      )}

      <section className="h-16 bg-[#1A1A1A] flex items-center px-4 gap-3 shadow-inner">
        <div className="relative">
          <button onClick={() => setOpenImageUpload((prev) => !prev)} className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center hover:scale-110">
            <FaPlus size={15} />
          </button>
          {openImageUpload && (
            <div className="absolute bottom-14 w-36 bg-[#1A1A1A] shadow-lg rounded-lg p-2">
              <label htmlFor="uploadImage" className="flex items-center p-2 cursor-pointer">
                <FaImage size={8} className="text-green-400" />
                <p className="ml-2">Image</p>
              </label>
              <input type="file" id="uploadImage" onChange={handleFileUpload} className="hidden" />
            </div>
          )}
        </div>
        <form className="flex-1 flex gap-2" onSubmit={handleSendMessage}>
          <input type="text" placeholder="Type a message..." className="flex-1 p-3 rounded-lg bg-[#1A1A1A] text-white outline-none" value={message.text} onChange={(e) => setMessage((prev) => ({ ...prev, text: e.target.value }))} />
          <button className="text-green-400 hover:text-green-300">
            <IoMdSend size={28} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default MessagePage;
