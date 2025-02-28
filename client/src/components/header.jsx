import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AppContent } from '../context/AppContext'

const Header = () => {
  const { userdata } = useContext(AppContent)
  return (
    <div className='flex flex-col items-center mt-20 px-4 text-center text-white'>
      <img
        src={assets.chat_logo}
        alt="header_img"
        className='w-36 h-36 rounded-full mb-6 rotate-logo'  // Add the rotating animation class here
      />
      <h1 className='flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2 '>Hey {userdata ? userdata.name : 'Developer'}!<img className='w-8 aspect-square' src={assets.hand_wave}/></h1>
      <h2 className='text-3xl sm:text-5xl font-semibold mb-4'>Welcome to Chattsphere</h2>
      <p className='mb-8 max-w-md'>Lets connect with People</p>
      <button className='border border-gray-500 rounded-full px-8 py-2.5 hover:bg-gray-100 transition-all'>Get Started</button>
    </div>
  )
}

export default Header
