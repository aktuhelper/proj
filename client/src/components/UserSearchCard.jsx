import { useNavigate } from "react-router-dom";

const UserSearchCard = ({ user, onClose }) => {
  const navigate = useNavigate();


  const handleOpenChat = () => {
    navigate(`/${user._id}`, { state: { recipient: user } }); // Pass user data in state
    onClose(); // Close the search modal
  };

  return (
    <div onClick={handleOpenChat} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-black/20 rounded-lg">
      <img src={user.profile_pic} alt="User" className="w-10 h-10 rounded-full" />
      <p className="text-white">{user.name}</p>
    </div>
  );
};

export default UserSearchCard;
