import React, { useEffect, useState } from "react";
import { IoSearchOutline, IoClose } from "react-icons/io5";
import axios from "axios";
import { toast } from "react-toastify";
import UserSearchCard from "./UserSearchCard";

const SearchUser = ({ onClose }) => {
  const [searchUser, setSearchUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearchUser = async () => {
    if (!search.trim()) {
      setSearchUser([]); // Clear results when input is empty
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/searchuser?search=${encodeURIComponent(search)}`
      ); // ✅ Corrected import.meta.env

      setSearchUser(response.data.data);
    } catch (error) {
      console.error("API Error:", error); // ✅ Log errors in the console
      toast.error(error?.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearchUser();
    }, 500); // Adding debounce for efficient API calls

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div 
      id="modal-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={(e) => e.target.id === "modal-overlay" && onClose()} // Close modal on outside click
    >
      <div className="w-full max-w-md bg-[#1A1A1A] text-white rounded-lg shadow-lg p-5 relative">
        {/* Close Button */}
        <button className="absolute top-3 right-3 text-gray-400 hover:text-white" onClick={onClose}>
          <IoClose size={24} />
        </button>

        {/* Search Box */}
        <div className="flex items-center border border-gray-600 rounded-lg p-2 shadow-sm">
          <IoSearchOutline size={24} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search user by name, email..."
            className="w-full outline-none bg-transparent text-white placeholder-gray-400"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>

        {/* Search Results */}
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {loading && <p className="text-center text-gray-400">Searching...</p>}
          {!loading && searchUser.length === 0 && search && (
            <p className="text-center text-gray-400">No user found!</p>
          )}
          {!loading &&
            searchUser.map((user) => <UserSearchCard key={user._id} user={user} onClose={onClose} />)}
        </div>
      </div>
    </div>
  );
};

export default SearchUser;
