import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import GlobalChatbot from './components/GlobalChatbot';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/toast.css';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/*" element={<App />} />
          </Routes>
          <GlobalChatbot />
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);
