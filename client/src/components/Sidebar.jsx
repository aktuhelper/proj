import { useContext, useEffect, useState, useCallback } from "react";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaUserPlus, FaImage, FaUserFriends } from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";
import { GoArrowUpLeft } from "react-icons/go";
import { AppContent } from "../context/AppContext";
import Avatar from "../components/Avatar";
import EditUserDetails from "./EditUserDetails";
import SearchUser from "./SearchUser";
import axios from "axios";
import { toast } from "react-toastify";
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const { userdata, socket, backendUrl } = useContext(AppContent);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingFriendRequests, setLoadingFriendRequests] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Fetch Friend Requests
  const fetchFriendRequests = useCallback(async () => {
    try {
      setLoadingFriendRequests(true);
      const response = await axios.get(`${backendUrl}/api/friend-requests/${userdata._id}`, { withCredentials: true });
      setFriendRequests(response.data.friendRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      toast.error('Failed to fetch friend requests');
    } finally {
      setLoadingFriendRequests(false);
    }
  }, [userdata, backendUrl]);

  // Fetch Friends
  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await axios.get(`${backendUrl}/api/friends/user/${userdata._id}/friends`, { withCredentials: true });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to fetch friends');
    } finally {
      setLoadingFriends(false);
    }
  }, [userdata, backendUrl]);

  useEffect(() => {
    if (userdata?._id) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [fetchFriends, fetchFriendRequests, userdata?._id]);

  // Load friend requests and friends from localStorage
  useEffect(() => {
    const savedFriendRequests = JSON.parse(localStorage.getItem('friendRequests'));
    const savedFriends = JSON.parse(localStorage.getItem('friends'));

    if (savedFriendRequests) {
      setFriendRequests(savedFriendRequests);
    }

    if (savedFriends) {
      setFriends(savedFriends);
    }
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("fetchConversations");
    socket.on("conversation", (convos) => {
      setConversations(convos.length === 0 ? [] : convos);
    });

    socket.on("message", () => {
      socket.emit("fetchConversations");
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receive-friend-request", (request) => {
      setFriendRequests((prevRequests) => [request, ...prevRequests]);
      toast.info(`You have a new friend request from ${request.sender.name}`);
    });

    return () => {
      socket.off("conversation");
      socket.off("onlineUsers");
      socket.off("message");
      socket.off("receive-friend-request");
    };
  }, [socket]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/logout');
      if (data.success) {
        toast.success(data.message);
        navigate('/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout.');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const userId = userdata._id;
    try {
      // Send API request to accept the friend request
      const response = await axios.post(`${backendUrl}/api/friends/accept/${requestId}`, { userId });

      // Assuming the response returns the new friend added
      const newFriend = response.data.friend;

      // Update the local state: remove the request and add the new friend
      setFriendRequests((prevRequests) => {
        const updatedRequests = prevRequests.filter((request) => request._id !== requestId);
        localStorage.setItem('friendRequests', JSON.stringify(updatedRequests)); // Update localStorage
        return updatedRequests;
      });

      setFriends((prevFriends) => {
        const updatedFriends = [...prevFriends, newFriend];
        localStorage.setItem('friends', JSON.stringify(updatedFriends)); // Update localStorage
        return updatedFriends;
      });

      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error accepting friend request.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const userId = userdata._id;
    try {
      // Send API request to reject the friend request
      await axios.post(`${backendUrl}/api/friends/reject/${requestId}`, { userId });

      // Update the local state: remove the rejected request
      setFriendRequests((prevRequests) => {
        const updatedRequests = prevRequests.filter((request) => request._id !== requestId);
        localStorage.setItem('friendRequests', JSON.stringify(updatedRequests)); // Update localStorage
        return updatedRequests;
      });

      toast.error("Friend request rejected.");
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error rejecting friend request.');
    }
  };

  if (!userdata) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[70px,1fr] bg-[#232121] text-white">
      {/* Sidebar */}
      <div className="w-16 h-full py-5 text-gray-300 flex flex-col justify-between rounded-3xl bg-black/30 backdrop-blur-2xl bg-opacity-50 shadow-lg shadow-black/40">
        <div className="space-y-4">
          <button
            onClick={() => setShowFriends(false)}
            className={`w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300 ${!showFriends ? "bg-blue-600" : "shadow-lg shadow-blue-500/50"} hover:scale-110 hover:bg-blue-700`}
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
            className={`w-14 h-14 flex justify-center items-center cursor-pointer rounded-full transition-all duration-300 ${showFriends ? "bg-blue-600" : "shadow-lg shadow-blue-500/50"} hover:scale-110 hover:bg-blue-700`}
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
              <>
                {loadingFriendRequests ? (
                  <div className="text-center">Loading friend requests...</div>
                ) : friendRequests.length > 0 ? (
                  <div className="my-4">
                    <h3 className="text-lg text-white mb-3">Friend Requests</h3>
                    {friendRequests.map((request) => (
                      <div
                        key={request._id}
                        className="flex flex-col items-start py-3 px-2 border border-transparent hover:bg-transparent cursor-pointer rounded-full"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            imageUrl={request.sender?.profile_pic || "/path/to/default/image.png"}
                            name={request.sender?.name}
                            width={52}
                            height={42}
                            className="rounded-full"
                          />
                          <h3 className="font-semibold text-base text-white">{request.sender.name}</h3>
                        </div>
                        <div className="ml-auto flex gap-2 mt-2">
                          <button
                            onClick={() => handleAcceptRequest(request._id)}
                            className="bg-green-600 text-white py-1 px-4 rounded-full hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request._id)}
                            className="bg-red-600 text-white py-1 px-4 rounded-full hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg text-center text-slate-400">No friend requests.</p>
                )}
                {loadingFriends ? (
                  <div className="text-center">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <p className="text-lg text-center text-slate-400">No friends found.</p>
                ) : (
                  <>
                    <h3 className="text-lg text-white mb-3">Your Friends</h3>
                    {friends.map((friend) => (
                      <div
                        key={friend?._id}
                        className="flex items-center gap-3 py-3 px-2 border border-transparent cursor-pointer rounded-full"
                      >
                        <Avatar
                          imageUrl={friend?.profile_pic || "/path/to/default/image.png"}
                          name={friend?.name}
                          width={52}
                          height={42}
                          className="rounded-full"
                        />
                        <h3 className="font-semibold text-base text-white">{friend?.name}</h3>
                      </div>
                    ))}
                  </>
                )}
              </>
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
                    state={{ recipient: otherUser }}
                    key={conv?._id}
                    className="flex items-center gap-3 py-3 px-2 border border-transparent hover:backdrop-blur-sm hover:bg-black/40 hover:shadow-lg hover:shadow-black/40 cursor-pointer rounded-full"
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
                          <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                            {conv?.lastMsg?.text}
                          </span>
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
