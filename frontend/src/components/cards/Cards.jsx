import React, { useState, useEffect } from "react";
import "./Cards.css";
import { useNavigate } from "react-router-dom";

const Cards = () => {
  const [resourceType, setResourceType] = useState("donated");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [donatedResources, setDonatedResources] = useState([]);
  const [requestedResources, setRequestedResources] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("user_id");

  // ✅ Fetch donated resources
  useEffect(() => {
    const fetchDonatedResources = async () => {
      try {
        const response = await fetch("http://localhost:5000/donatedResources");
        const data = await response.json();
        console.log("Fetched donated resources:", data);
        setDonatedResources(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching donated resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonatedResources();
  }, []);

  // ✅ Fetch requested resources
  useEffect(() => {
    const fetchRequestedResources = async () => {
      try {
        const response = await fetch("http://localhost:5000/requestedResources");
        const data = await response.json();
        console.log("Fetched requested resources:", data);
        setRequestedResources(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching requested resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestedResources();
  }, []);

  // ✅ Request a resource
  const handleRequestResource = async (resourceId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/request-resource/${resourceId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updatedResources = donatedResources.map((resource) =>
          resource._id === resourceId
            ? {
                ...resource,
                requestedBy: Array.isArray(resource.requestedBy)
                  ? [...resource.requestedBy, { userId: currentUserId }]
                  : [{ userId: currentUserId }],
              }
            : resource
        );
        setDonatedResources(updatedResources);
        setRequestMessage("Resource requested successfully ✅");
      } else {
        setRequestMessage("Failed to request the resource ❌");
      }
    } catch (error) {
      console.error("Error requesting resource:", error);
      setRequestMessage("An error occurred while requesting the resource ❌");
    }
  };

  // ✅ Donate a resource
  const handleDonateResource = async (resourceId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/donate-resource/${resourceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updatedResources = requestedResources.map((resource) =>
          resource._id === resourceId
            ? {
                ...resource,
                donatedBy: Array.isArray(resource.donatedBy)
                  ? [...resource.donatedBy, { userId: currentUserId }]
                  : [{ userId: currentUserId }],
              }
            : resource
        );
        setRequestedResources(updatedResources);
        setRequestMessage("Resource donated successfully ✅");
      } else {
        setRequestMessage("Failed to donate the resource ❌");
      }
    } catch (error) {
      console.error("Error donating resource:", error);
      setRequestMessage("An error occurred while donating the resource ❌");
    }
  };

  // ✅ Navigate to chat page
  const handleChat = (resourceId) => {
    navigate(`/chat/${resourceId}`); // <-- Pass resource ID to chat
  };

  // ✅ Filter resources by category
  const filteredDonatedResources =
    categoryFilter === "all"
      ? donatedResources
      : donatedResources.filter(
          (resource) => resource.category === categoryFilter
        );

  const filteredRequestedResources =
    categoryFilter === "all"
      ? requestedResources
      : requestedResources.filter(
          (resource) => resource.category === categoryFilter
        );

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading resources...</p>;
  }

  return (
    <div className="cards-section">
      {/* Resource Type Selector */}
      <div className="dropdown">
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        >
          <option value="donated">Donated Resources</option>
          <option value="requested">Requested Resources</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="dropdown">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="clothes">Clothes</option>
        </select>
      </div>

      {/* Donated Resources */}
      {resourceType === "donated" && (
        <div className="card-container">
          {filteredDonatedResources.length > 0 ? (
            filteredDonatedResources.map((resource) => {
              const isRequestedByCurrentUser = Array.isArray(resource.requestedBy)
                ? resource.requestedBy.some(
                    (request) => request.userId === currentUserId
                  )
                : false;

              return (
                <div key={resource._id} className="card">
                  <img
                    src={`http://localhost:5000${resource.image?.[0] || "/default.png"}`}
                    alt={resource.resourceName}
                    className="card-image"
                  />
                  <h3>{resource.resourceName}</h3>
                  <p>Quantity: {resource.quantity}</p>
                  <p>Description: {resource.description}</p>
                  <p>Location: {resource.location}</p>
                  <p>Donated By: {resource?.userId?.name || "Unknown"}</p>

                  {isRequestedByCurrentUser ? (
                    <>
                      <button
                        className="requested-button"
                        disabled
                        style={{ marginRight: "10px" }}
                      >
                        Requested
                      </button>
                      <button
                        className="chat-button"
                        onClick={() => handleChat(resource._id)}
                      >
                        Chat
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRequestResource(resource._id)}
                      className="request-button"
                    >
                      Request
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p>No donated resources available.</p>
          )}
        </div>
      )}

      {/* Requested Resources */}
      {resourceType === "requested" && (
        <div className="card-container">
          {filteredRequestedResources.length > 0 ? (
            filteredRequestedResources.map((resource) => {
              const isRequestedByCurrentUser =
                Array.isArray(resource.requestedBy) &&
                resource.requestedBy.some(
                  (request) => request.userId === currentUserId
                );

              return (
                <div key={resource._id} className="card">
                  <img
                    src={`http://localhost:5000${resource.image?.[0] || "/default.png"}`}
                    alt={resource.resourceName}
                    className="card-image"
                  />
                  <h3>{resource.resourceName}</h3>
                  <p>Quantity: {resource.quantity}</p>
                  <p>Description: {resource.description}</p>
                  <p>Location: {resource.location}</p>
                  <p>Requested By: {resource?.userId?.name || "Unknown"}</p>

                  {isRequestedByCurrentUser ? (
                    <>
                      <button
                        className="requested-button"
                        disabled
                        style={{ marginRight: "10px" }}
                      >
                        Requested
                      </button>
                      <button
                        className="chat-button"
                        onClick={() => handleChat(resource._id)}
                      >
                        Chat
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDonateResource(resource._id)}
                      className="request-button"
                    >
                      Donate
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p>No requested resources available.</p>
          )}
        </div>
      )}

      {/* Message Display */}
      {requestMessage && <p className="request-message">{requestMessage}</p>}
    </div>
  );
};

export default Cards;
