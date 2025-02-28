import React, { useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";

const Home = () => {
  const { backendUrl, userdata, socket } = useContext(AppContent); // Access socket
  const location = useLocation();
  const basePath = location.pathname === "/"; // Check if it's the home route

  return (
    <div className="grid lg:grid-cols-[300px,1fr] h-screen max-h-screen">
      {/* Sidebar Section */}
      <section className={` ${basePath ? "block" : "hidden"} lg:block`}>
        <Sidebar />
      </section>

      {/* Main Content Section */}
      <section className={`${basePath ? "hidden" : "block"} w-full`}>
        <Outlet />
      </section>
      <div
        className={`justify-center items-center flex-col gap-2 hidden ${!basePath ? "hidden" : "lg:flex"}`}
      >
        <div>
          <img src={assets.chat_logo} width={200} alt="logo" />
        </div>
        <p className="text-lg mt-2 text-slate-200">
          Hi {userdata?.name}! welcome to Chattsphere
        </p>
      </div>
    </div>
  );
};

export default Home;
