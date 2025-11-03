import React from 'react';
import './Header.css';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      {/* Hero Section */}
      <section className="hero">
        <h1>Share what you can, receive what you need</h1>
        <p>Connecting communities for a better tomorrow.</p>
        <div className="hero-buttons">
          <button 
            onClick={() => navigate("/list-resource")} 
            className="btn" 
            aria-label="Donate resources"
          >
            Donate Resources
          </button>
          
        </div>
      </section>
    </header>
  );
};

export default Header;
