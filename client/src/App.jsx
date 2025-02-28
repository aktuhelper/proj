import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import MessagePage from './components/MessagePage'; // Import MessagePage
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import RandomChatPage from './components/randomChatPage';


const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />}>
        <Route path=":userId" element={<MessagePage />} />
        </Route>
        <Route path='/login' element={<Login />} />
        <Route path='/randomChat' element={<RandomChatPage />} />
        <Route path='/email-verify' element={<VerifyEmail />} />
        <Route path='/reset-password' element={<ResetPassword />} />
      </Routes>
    </div>
  );
};

export default App;
