// src/components/UserProfile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

export default function UserProfile() {
  const [user, setUser] = useState({});
  const [requestedResources, setRequestedResources] = useState([]);
  const [donatedResources, setDonatedResources] = useState([]);
  const [selectedView, setSelectedView] = useState("yourRequests");
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    if (!authToken || !userId) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/profile/${userId}`);
      const data = await res.json();

      setUser({ name: data.name || "User" });
      setRequestedResources(data.requestedResources || []);
      setDonatedResources(data.donatedResources || []);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleAccept = async (resourceId, requesterId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/donation/${resourceId}/accept/${requesterId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (res.ok) {
        alert("Accepted — all others rejected automatically.");
        fetchProfile();
      } else {
        const body = await res.json();
        alert(body.message || "Failed to accept.");
      }
    } catch (err) {
      console.error(err);
      alert("Error accepting request");
    }
  };

  const handleReject = async (resourceId, requesterId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/donation/${resourceId}/reject/${requesterId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (res.ok) {
        alert("Request rejected.");
        fetchProfile();
      } else {
        const body = await res.json();
        alert(body.message || "Failed to reject.");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting request");
    }
  };

  const handleComplete = async (resourceId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/donation/${resourceId}/complete`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (res.ok) {
        alert("Donation marked completed.");
        fetchProfile();
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAcceptedList = () =>
    donatedResources.flatMap((resource) =>
      (resource.requestedBy || [])
        .filter((r) => r.status === "accepted")
        .map((r) => ({ resource, requester: r }))
    );

  const getRejectedList = () =>
    donatedResources.flatMap((resource) =>
      (resource.requestedBy || [])
        .filter((r) => r.status === "rejected")
        .map((r) => ({ resource, requester: r }))
    );

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="profile-header">
        <img src="/default-profile-pic.jpg" alt="Profile" className="profile-pic" />
        <div>
          <h1>{user.name}</h1>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      <div className="dropdown-container">
        <select
          value={selectedView}
          onChange={(e) => setSelectedView(e.target.value)}
        >
          <option value="yourRequests">Your Requests</option>
          <option value="donated">Your Donated Items</option>
          <option value="requesters">People Who Requested Your Donations</option>
          <option value="accepted">Accepted Requests</option>
          <option value="rejected">Rejected Requests</option>
        </select>
      </div>

      {/* 1️⃣ YOUR REQUESTS */}
      {selectedView === "yourRequests" && (
        <div className="resources-section">
          <h2>Your Requests</h2>

          {requestedResources.length === 0 && <p>No requests found.</p>}

          {requestedResources.map((resource) => {
            const myReq = (resource.requestedBy || []).find(
              (r) =>
                r.userId?._id === userId ||
                r.userId?.toString?.() === userId
            );

            return (
              <div key={resource._id} className="resource-item">
                <h3>{resource.resourceName}</h3>
                <p>Quantity: {resource.quantity}</p>
                <p>Location: {resource.location}</p>
                <p>Status: {myReq ? myReq.status : "pending"}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 2️⃣ YOUR DONATED ITEMS */}
      {selectedView === "donated" && (
        <div className="resources-section">
          <h2>Your Donated Items</h2>

          {donatedResources.length === 0 && <p>You haven't donated anything.</p>}

          {donatedResources.map((resource) => (
            <div key={resource._id} className="resource-item">
              <h3>{resource.resourceName}</h3>
              <p>Quantity: {resource.quantity}</p>
              <p>Location: {resource.location}</p>
              <p>Status: {resource.finalStatus}</p>

              {resource.finalStatus === "in_process" && (
                <button onClick={() => handleComplete(resource._id)}>
                  Mark as Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3️⃣ PEOPLE WHO REQUESTED YOUR DONATIONS */}
      {selectedView === "requesters" && (
        <div className="resources-section">
          <h2>People Who Requested Your Donations</h2>

          {donatedResources.length === 0 && <p>No donated resources found.</p>}

          {donatedResources.map((resource) => (
            <div key={resource._id} className="resource-item">
              <h3>{resource.resourceName}</h3>

              {(resource.requestedBy || []).length === 0 && (
                <p>No one has requested this item yet.</p>
              )}

              {(resource.requestedBy || []).map((r) => (
                <div key={r.userId?._id || r.userId} className="requester-card">
                  <p><strong>Name:</strong> {r.userId?.name || "Unknown"}</p>
                  <p>
                    <strong>Requested At:</strong>{" "}
                    {new Date(r.requestedAt).toLocaleString()}
                  </p>
                  <p><strong>Status:</strong> {r.status}</p>

                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleAccept(resource._id, r.userId._id || r.userId)
                        }
                        className="accept-btn"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() =>
                          handleReject(resource._id, r.userId._id || r.userId)
                        }
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 4️⃣ ACCEPTED REQUESTS */}
      {selectedView === "accepted" && (
        <div className="resources-section">
          <h2>Accepted Requests</h2>

          {getAcceptedList().length === 0 && <p>No accepted requests.</p>}

          {getAcceptedList().map(({ resource, requester }) => (
            <div key={`${resource._id}-${requester.userId}`} className="resource-item">
              <p><strong>Requester:</strong> {requester.userId?.name || requester.userId}</p>
              <p><strong>Resource:</strong> {resource.resourceName}</p>
            </div>
          ))}
        </div>
      )}

      {/* 5️⃣ REJECTED REQUESTS */}
      {selectedView === "rejected" && (
        <div className="resources-section">
          <h2>Rejected Requests</h2>

          {getRejectedList().length === 0 && <p>No rejected requests.</p>}

          {getRejectedList().map(({ resource, requester }) => (
            <div key={`${resource._id}-${requester.userId}`} className="resource-item">
              <p><strong>Requester:</strong> {requester.userId?.name || requester.userId}</p>
              <p><strong>Resource:</strong> {resource.resourceName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
