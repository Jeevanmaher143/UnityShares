import React, { useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import "./Navbar.css";
import { NavLink, useNavigate } from "react-router-dom";

export const Navbar = () => {
  const [menu, setMenu] = useState("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "New donation request received." },
    { id: 2, message: "Your donation has been approved." },
    
  ]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term); // Pass the search term to parent component
  };

  useEffect(() => {
    // You can add logic here to check for authToken on page load if necessary.
  }, []);

  const handleClickMenu = (menuName) => {
    setMenu(menuName);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Remove the authToken from localStorage
    setIsDropdownOpen(false);
    navigate("/login"); // Redirect to login page after logout
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) {
      navigate("/notifications");
    }
  };

  const authToken = localStorage.getItem("authToken"); // Check if authToken exists in localStorage

  return (
    <div className="navbar">
      <div className="logo">
        Unity<span>Share</span>
      </div>

      <div className="navbar-left">
        <ul>
          <li>
            <NavLink
              to="/"
              onClick={() => handleClickMenu("Home")}
              className={menu === "Home" ? "active" : ""}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/list-resource"
              onClick={() => handleClickMenu("List Resource")}
              className={menu === "List Resource" ? "active" : ""}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Donate Resource
            </NavLink>
          </li>
          
          <li>
            <NavLink
              to="/contact-us"
              onClick={() => handleClickMenu("Contact Us")}
              className={menu === "Contact Us" ? "active" : ""}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Contact Us
            </NavLink>
          </li>
        </ul>

        <div className="search">
          <input type="text" placeholder="Search..." />
          <div className="search-icon">
            <img src={assets.search} alt="" />
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-notification-icon" onClick={() => navigate("/notifications")}>
          <img src={assets.notification} alt="" />
          <div className="dot"></div>
        </div>

        <div className="navbar-chat-icon">
          <img src={assets.message} alt="" onClick={() => navigate("/chat")} />
          <div className="dot"></div>
        </div>

        <div className="navbar-cart-icon" onClick={() => navigate("/cart")}>
          <img src={assets.cart} alt="" />
          <div className="dot"></div>
        </div>

        {authToken ? (
          <div className="navbar-user-profile">
            <img
              src={assets.userprofile}
              alt="User"
              className="user-icon"
              onClick={toggleDropdown}
            />
            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                <ul>
                  <li onClick={() => navigate("/profile")}>Profile</li>
                  <li onClick={handleLogout}>Logout</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar-login-signup-btn">
            <button onClick={() => navigate("/login")} className="login-button">
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
