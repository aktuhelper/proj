import React from 'react';
import { PiUserCircle } from "react-icons/pi";

const Avatar = ({ userId, name, imageUrl, width = 40, height = 40 }) => {
  let avatarName = "";

  if (name) {
    const splitName = name.split(" ");
    avatarName = splitName.length > 1 ? splitName[0][0] + splitName[1][0] : splitName[0][0];
  }

  const bgColor = [
    'bg-slate-200',
    'bg-teal-200',
    'bg-red-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-gray-200',
    "bg-cyan-200",
    "bg-sky-200",
    "bg-blue-200"
  ];

  const randomNumber = Math.floor(Math.random() * bgColor.length);

  return (
    <div
      className="relative flex justify-center items-center rounded-full overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px`, aspectRatio: "1/1" }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: "100%", height: "100%" }}
        />
      ) : name ? (
        <div
          className={`flex justify-center items-center text-lg font-bold text-white ${bgColor[randomNumber]}`}
          style={{ width: "100%", height: "100%" }}
        >
          {avatarName.toUpperCase()}
        </div>
      ) : (
        <PiUserCircle size={width} className="text-gray-400" />
      )}
    </div>
  );
};

export default Avatar;
