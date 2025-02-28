import React, { useContext, useEffect, useState } from "react";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaUserPlus, FaImage } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { RiLogoutBoxLine } from "react-icons/ri";
import { GoArrowUpLeft } from "react-icons/go";
import { AppContent } from "../context/AppContext";
import Avatar from "../components/Avatar";
import EditUserDetails from "./EditUserDetails";
import SearchUser from "./SearchUser";

const Sidebar = () => {
  const { userdata, getUserData } = useContext(AppContent);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [allUser, setAllUser] = useState([]);
  const [openSearchUser, setOpenSearchUser] = useState(false);

  useEffect(() => {
    getUserData();
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
  };

  return (
    <div className="w-full h-full grid grid-cols-[70px,1fr] bg-[#232121] text-white">
      {/* Sidebar */}
      <div className="w-16 h-full py-5 text-gray-300 flex flex-col justify-between rounded-3xl 
                      bg-black/30 backdrop-blur-2xl bg-opacity-50 shadow-lg shadow-black/40">
        <div className="space-y-4">
          {/* Chat Button */}
          <NavLink
            to="/randomChat"
            className={({ isActive }) =>
              `w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300
               ${isActive ? "bg-blue-600" : "shadow-lg shadow-blue-500/50"}
               hover:scale-110 hover:bg-blue-700`
            }
            title="Chat"
          >
            <IoChatbubbleEllipses size={22} className="text-white" />
          </NavLink>

          {/* Add User Button */}
          <button
            onClick={() => setOpenSearchUser(true)}
            className="w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300
                       shadow-lg shadow-blue-500/50 hover:scale-110 hover:bg-blue-700"
            title="Add User"
          >
            <FaUserPlus size={22} className="text-white" />
          </button>
        </div>

        {/* User Avatar & Logout */}
        <div className="flex flex-col items-center">
          <button
            className="relative mx-auto mb-6 hover:scale-105 transition-transform duration-300"
            title={userdata?.name || "Developer"}
            onClick={() => setEditUserOpen(true)}
          >
            {/* Animated Glowing Ring */}
            <div className="absolute -inset-1.5 w-15 h-15 rounded-full border-2 border-blue-500 
                            animate-pulse shadow-lg shadow-blue-500/50 flex items-center justify-center"></div>

            <Avatar
              imageUrl={userdata?.profile_pic}
              name={userdata?.name || "Developer"}
              width={48}
              height={48}
              className="rounded-full relative"
            />
          </button>

          <button
            onClick={handleLogout}
            className="w-12 h-12 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300
                       hover:scale-110 bg-red-600 hover:bg-red-700"
            title="Logout"
          >
            <RiLogoutBoxLine size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
        <div className="h-16 flex items-center">
          <h2 className="text-xl font-bold p-4 text-slate-100">Message</h2>
        </div>

        {/* Chat List */}
        <div className="h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar">
          {allUser.length === 0 ? (
            <div>
              <div className="flex justify-center items-center my-4 text-slate-500">
                <GoArrowUpLeft size={50} />
              </div>
              <p className="text-lg text-center text-slate-400">
                Explore users to start a conversation with.
              </p>
            </div>
          ) : (
            allUser.map((conv) => (
              <NavLink
                to={`/${conv?.userDetails?._id}`}
                key={conv?.userDetails?._id}
                className="flex items-center gap-2 py-3 px-2 border border-transparent hover:bg-blue-600 cursor-pointer rounded-full"
              >
                <Avatar
                  imageUrl={conv?.userDetails?.profile_pic}
                  name={conv?.userDetails?.name}
                  width={42}
                  height={42}
                  className="rounded-full"
                />
                <div>
                  <h3 className="text-ellipsis line-clamp-1 font-semibold text-base text-white">
                    {conv?.userDetails?.name}
                  </h3>
                  <div className="text-slate-300 text-xs flex items-center gap-1">
                    {conv?.lastMsg?.imageUrl && (
                      <div className="flex items-center gap-1">
                        <FaImage />
                        {!conv?.lastMsg?.text && <span>Image</span>}
                      </div>
                    )}
                    {conv?.lastMsg?.text && <span>{conv.lastMsg.text}</span>}
                  </div>
                </div>
                {Boolean(conv?.unseenMsg) && (
                  <p className="text-xs w-5 h-5 flex justify-center items-center ml-auto p-1 bg-blue-500 text-white font-semibold rounded-full">
                    {conv?.unseenMsg}
                  </p>
                )}
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* Edit User Details */}
      {editUserOpen && <EditUserDetails onClose={() => setEditUserOpen(false)} />}

      {/* Search User Popup */}
      {openSearchUser && <SearchUser onClose={() => setOpenSearchUser(false)} />}
    </div>
  );
};

export default Sidebar;
