import React from "react";
import './Footer.css';
import { assets } from "../../assets/assets"; // Ensure the assets import path is correct
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <>
      {/* Footer Section */}
      <footer>
        <div className="footer-links">
          <NavLink to="/about">About Us</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>

        <div className="social-media">
          <a href="https://www.facebook.com/profile.php?id=100025377671917" target="_blank" rel="noopener noreferrer">
            <img src={assets.facebook} alt="Facebook" />
          </a>
          <a href="https://twitter.com/your-profile" target="_blank" rel="noopener noreferrer">
            <img src={assets.x} alt="Twitter" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <img src={assets.instagram} alt="Instagram" />
          </a>
        </div>

        <p>© 2024 UnityShare. All Rights Reserved.</p>
      </footer>
    </>
  );
};

export default Footer;
