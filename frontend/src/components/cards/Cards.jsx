// src/components/Cards.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cards.css";

export default function Cards() {
  const [resourceType, setResourceType] = useState("donated");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [donatedResources, setDonatedResources] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("user_id");
  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    fetchDonatedResources();
  }, []);

  const fetchDonatedResources = async () => {
    try {
      const res = await fetch("http://localhost:5000/donatedResources");
      const data = await res.json();
      setDonatedResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching donated resources:", err);
    }
  };

  // Request resource
  const handleRequestResource = async (resourceId) => {
    try {
      const res = await fetch(`http://localhost:5000/request/${resourceId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        setRequestMessage("Resource requested successfully ✅");
        // Update local state: find resource and append request
        setDonatedResources((prev) =>
          prev.map((r) =>
            r._id === resourceId ? { ...json.donation } : r
          )
        );
      } else {
        const body = await res.json();
        setRequestMessage(body.message || "Failed to request resource ❌");
      }
    } catch (err) {
      console.error(err);
      setRequestMessage("An error occurred while requesting the resource ❌");
    }
    // clear message after a short while
    setTimeout(() => setRequestMessage(""), 4000);
  };

  const handleChat = (resourceId) => {
    navigate(`/chat/${resourceId}`);
  };

  const filteredDonatedResources =
    categoryFilter === "all"
      ? donatedResources
      : donatedResources.filter((resource) => resource.category === categoryFilter);

  return (
    <div className="cards-section">
      <div className="dropdown">
        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="donated">Donated Resources</option>
        </select>
      </div>

      <div className="dropdown">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="clothes">Clothes</option>
        </select>
      </div>

      <div className="card-container">
        {filteredDonatedResources.length === 0 && <p>No donated resources available.</p>}
        {filteredDonatedResources.map((resource) => {
          const userReq = (resource.requestedBy || []).find(
            (r) => (r.userId && (r.userId._id === currentUserId || r.userId.toString() === currentUserId))
          );

          return (
            <div key={resource._id} className="card">
              <img src={resource.image?.[0] ? `http://localhost:5000${resource.image[0]}` : "/default.png"} alt={resource.resourceName} className="card-image" />
              <h3>{resource.resourceName}</h3>
              <p>Quantity: {resource.quantity}</p>
              <p>Description: {resource.description}</p>
              <p>Location: {resource.location}</p>
              <p>Donated By: {resource.userId?.name || "Unknown"}</p>
              <p>Status: {resource.finalStatus}</p>

              {userReq ? (
                <>
                  <button className="requested-button" disabled>Requested ({userReq.status})</button>
                  {userReq.status === "accepted" && <button className="chat-button" onClick={() => handleChat(resource._id)}>Chat</button>}
                </>
              ) : (
                <button onClick={() => handleRequestResource(resource._id)} className="request-button">
                  Request
                </button>
              )}
            </div>
          );
        })}
      </div>

      {requestMessage && <p className="request-message">{requestMessage}</p>}
    </div>
  );
}
