import React, { useContext, useEffect, useState, useCallback } from "react";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaUserPlus, FaImage, FaUserFriends } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { RiLogoutBoxLine } from "react-icons/ri";
import { GoArrowUpLeft } from "react-icons/go";
import { AppContent } from "../context/AppContext";
import Avatar from "../components/Avatar";
import EditUserDetails from "./EditUserDetails";
import SearchUser from "./SearchUser";

const Sidebar = () => {
  const { userdata, socket } = useContext(AppContent);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Fetch conversations when component mounts
    socket.emit("fetchConversations");

    socket.on("conversation", (convos) => {
      setConversations(convos);
    });

    // Listen for online users
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Refresh chat list when a new message is received
    socket.on("message", () => {
      socket.emit("fetchConversations");
    });

    return () => {
      socket.off("conversation");
      socket.off("onlineUsers");
      socket.off("message");
    };
  }, [socket]);

  const handleLogout = useCallback(() => {
    console.log("Logging out...");
    localStorage.removeItem("token");
    window.location.reload();
  }, []);

  if (!userdata) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[70px,1fr] bg-[#232121] text-white">
      {/* Sidebar */}
      <div className="w-16 h-full py-5 text-gray-300 flex flex-col justify-between rounded-3xl bg-black/30 backdrop-blur-2xl bg-opacity-50 shadow-lg shadow-black/40">
        <div className="space-y-4">
          <button
            onClick={() => setShowFriends(false)}
            className={`w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300 ${
              !showFriends ? "bg-blue-600" : "shadow-lg shadow-blue-500/50"
            } hover:scale-110 hover:bg-blue-700`}
            title="Chat"
            aria-label="Chat"
          >
            <IoChatbubbleEllipses size={22} className="text-white" />
          </button>
          <button
            onClick={() => setIsSearchUserOpen(true)}
            className="w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50 hover:scale-110 hover:bg-blue-700"
            title="Add User"
            aria-label="Add User"
          >
            <FaUserPlus size={22} className="text-white" />
          </button>
          <button
            onClick={() => setShowFriends(true)}
            className={`w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300 ${
              showFriends ? "bg-blue-600" : "shadow-lg shadow-blue-500/50"
            } hover:scale-110 hover:bg-blue-700`}
            title="Friends"
            aria-label="Friends"
          >
            <FaUserFriends size={22} className="text-white" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <button
            className="relative mx-auto mb-6 hover:scale-105 transition-transform duration-300"
            title={userdata?.name || "Developer"}
            onClick={() => setIsEditUserOpen(true)}
            aria-label="Edit User Details"
          >
            <div className="before:absolute before:-inset-1 before:border-2 before:border-blue-500 before:animate-pulse before:rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center"></div>
            <Avatar
              imageUrl={userdata?.profile_pic || "/path/to/default/image.png"}
              name={userdata?.name || "Developer"}
              width={48}
              height={48}
              className="rounded-full relative"
            />
          </button>
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300 hover:scale-110 bg-red-600 hover:bg-red-700"
            title="Logout"
            aria-label="Logout"
          >
            <RiLogoutBoxLine size={22} className="text-white" />
          </button>
        </div>
      </div>

      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center">
          <h2 className="text-xl font-bold p-4 text-slate-100">
            {showFriends ? "Friends" : "Messages"}
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar">
            {showFriends ? (
              friends.length === 0 ? (
                <p className="text-lg text-center text-slate-400">
                  No friends found.
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 py-3 px-2 border border-transparent hover:bg-blue-600 cursor-pointer rounded-full"
                  >
                    <Avatar
                      imageUrl={friend.profile_pic || "/path/to/default/image.png"}
                      name={friend.name}
                      width={52}
                      height={42}
                      className="rounded-full"
                    />
                    <h3 className="truncate text-ellipsis line-clamp-1 font-semibold text-base text-white">
                      {friend.name}
                    </h3>
                  </div>
                ))
              )
            ) : conversations.length === 0 ? (
              <div>
                <div className="flex justify-center items-center my-4 text-slate-500">
                  <GoArrowUpLeft size={50} />
                </div>
                <p className="text-lg text-center text-slate-400">
                  Explore users to start a conversation with.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUser =
                  conv?.sender?._id === userdata?._id ? conv?.receiver : conv?.sender;
                const isOnline = onlineUsers.includes(otherUser?._id);

                return (
                  <NavLink
                    to={`/${otherUser?._id}`}
                    key={conv?._id}
                    className="flex items-center gap-3 py-3 px-2 border border-transparent hover:bg-blue-600 cursor-pointer rounded-full"
                  >
                    <Avatar
                      imageUrl={otherUser?.profile_pic || "/path/to/default/image.png"}
                      name={otherUser?.name}
                      width={55}
                      height={42}
                      className="rounded-full"
                    />
                    <div className="flex flex-col justify-start w-full overflow-hidden">
                      <h3 className="truncate text-ellipsis line-clamp-1 font-semibold text-base text-white">
                        {otherUser?.name} {isOnline && <span className="text-green-500"> ⦿</span>}
                      </h3>
                      <div className="text-slate-300 text-xs flex items-center gap-1 w-full">
                        {conv?.lastMsg?.imageUrl && (
                          <>
                            <FaImage />
                            <span>Image</span>
                          </>
                        )}
                        {conv?.lastMsg?.text && (
                          <span className="truncate">{conv?.lastMsg?.text}</span>
                        )}
                      </div>
                    </div>
                  </NavLink>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isEditUserOpen && <EditUserDetails onClose={() => setIsEditUserOpen(false)} />}
      {isSearchUserOpen && <SearchUser onClose={() => setIsSearchUserOpen(false)} />}
    </div>
  );
};

export default Sidebar;
