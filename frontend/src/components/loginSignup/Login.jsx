import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ toggleForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login button clicked");
  
    const user = { email, password };
  
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
  
      const data = await response.json();
      if (response.ok) {
        // Store the token and user ID for use in further requests
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user_id", data.id);
        console.log("Login successful, token saved:", data.token);
  
        navigate("/");  // Redirect to home page
      } else {
        setErrorMessage(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };
  
  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="form-input"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-input"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="form-footer">
          <a href="#" className="forgot-password">
            Forgot Password?
          </a>
          <button type="submit" className="login-btn">
            Login
          </button>
        </div>
      </form>

      <div className="form-switch">
        <p>
          Don't have an account?{" "}
          <span className="switch-btn" onClick={toggleForm}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
