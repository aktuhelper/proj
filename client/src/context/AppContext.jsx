import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

export const AppContent = createContext();

export const AppContextProvider = ({ children }) => {
  axios.defaults.withCredentials = true;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [socket, setSocket] = useState(null);
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userdata, setUserdata] = useState(null);
  const [randomChatPartner, setRandomChatPartner] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/auth/isauth`);
        if (data.success) {
          setIsLoggedin(true);
          getUserData(); // Call getUserData separately
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Authentication failed");
      }
    };

    initializeAuth();

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, []);

  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`);
      if (data.success) {
        setUserdata(data.user);
        setupSocketConnection(data.user._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch user data");
    }
  };

  const setupSocketConnection = (userId) => {
    if (!userId) return;

    const socketConnection = io(backendUrl, { query: { userId } });

    socketConnection.on("connect", () => {
      console.log("Socket connected:", socketConnection.id);
    });

    socketConnection.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socketConnection.on("onlineUsers", (onlineUsers) => {
      console.log("Online users:", onlineUsers);
    });

    socketConnection.on("randomChatStarted", (data) => {
      console.log("Random chat started with partner:", data.partnerId); // Debug log
      setRandomChatPartner(data.partnerId); // Set the random chat partner
    });

    socketConnection.on("randomChatMessage", (message) => {
      console.log("Message received in random chat:", message);
    });

    socketConnection.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Error with the socket connection.");
    });

    setSocket(socketConnection);
  };

  const startRandomChat = () => {
    if (!socket || !userdata) {
      toast.error("Socket or User data not available.");
      return;
    }

    socket.emit("startRandomChat", userdata._id); // Trigger the random chat request
  };

  return (
    <AppContent.Provider
      value={{
        backendUrl,
        isLoggedin,
        setIsLoggedin,
        userdata,
        setUserdata,
        randomChatPartner,
        startRandomChat, // Function to start random chat
        getUserData,
        socket,
      }}
    >
      {children}
    </AppContent.Provider>
  );
};
