import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, History, User, LogOut, ChevronDown } from 'lucide-react';
import image from '../assets/project_nameAndLogo1.png';
import DarkImage from '../assets/project_nameAndLogo_Dark13.png';

import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Toggle theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null; // Only show navbar if user is logged in

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-left" onClick={() => navigate('/dashboard')}>
        <img src={isDarkMode ? image : DarkImage} alt="Logo" className="navbar-logo" />
      </div>

      <div className="navbar-right">
        <button 
          className="icon-btn theme-toggle" 
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          className={`icon-btn ${location.pathname === '/history' ? 'active' : ''}`}
          onClick={() => navigate('/history')}
          title="History"
        >
          <History size={20} />
        </button>

        <div className="profile-dropdown-container" ref={dropdownRef}>
          <button 
            className="profile-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="avatar">
              <User size={18} />
            </div>
            <span className="user-name">{user.name?.split(' ')[0]}</span>
            <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu animate-fade-in">
              <div className="dropdown-header">
                <p className="dropdown-name">{user.name}</p>
                <p className="dropdown-email">{user.email}</p>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={logout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
