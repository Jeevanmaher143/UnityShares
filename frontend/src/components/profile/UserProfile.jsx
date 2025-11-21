import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirecting to login page
import ProfileEdit from '../profileEdit/ProfileEdit';
import './UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState({
    name: '', // Default name will be empty until fetched
  });
  const [id,setId]=useState(null)
  const [requestedResources, setRequestedResources] = useState([]);
  const [donatedResources, setDonatedResources] = useState([]);
  const [donorsForRequestedResources, setDonorsForRequestedResources] = useState([]);
  const [requestersForDonatedResources, setRequestersForDonatedResources] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const userId = localStorage.getItem('user_id');
  const authToken = localStorage.getItem('authToken');
  const [selectedView, setSelectedView] = useState('donors'); // Default view is 'donors'
  const navigate = useNavigate(); // For redirecting to login page

  useEffect(() => {
    if (!authToken || !userId) {
      console.error("Missing auth token or user ID");
      navigate('/login'); // Redirect to login if no token or user ID
      return;
    }

    const fetchResources = async () => {
      setIsLoading(true); // Set loading to true at the start
      try {
        const response = await fetch(`http://localhost:5000/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            alert("Session expired. Please log in again.");
            localStorage.removeItem("authToken");
            navigate("/login");
          }
        } else {
          const data = await response.json();
          console.log("Fetched user data:", data); // Log the full response here
  
          const userName = data.name && typeof data.name === 'object' ? data.name.name : data.name; // Access 'name' inside the object if it's an object
          
          setUser({
            name: userName || 'Unknown User', // Set the name correctly or fallback to 'Unknown User'
          });
          setDonatedResources(data.donatedResources || []);
          setRequestedResources(data.requestedResources || []);
  
          // Fetch donors for requested resources and requesters for donated resources
          fetchDonorsForRequestedResources(data.requestedResources);
          fetchRequestersForDonatedResources(data.donatedResources);
          fetchAcceptedRequests();
          fetchRejectedRequests();

          // Fetch the resourceId for requested or donated resources
          if (data.donatedResources.length > 0) {
            const firstResourceId = data.donatedResources[0]._id; // Example: Fetch the first resourceId
            setId(firstResourceId)
            console.log("First Resource ID:", firstResourceId);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false); // Ensure loading is false after fetching
      }
    };
  
    fetchResources();



    
  }, [userId, authToken, navigate]); // Re-fetch when userId or authToken changes

  const fetchUserData = async () => {
    setIsLoading(true); // Set loading to true at the start
    try {
      const response = await fetch(`http://localhost:5000/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken");
          navigate("/login");
        }
      } else {
        const data = await response.json();
        console.log("Fetched user data:", data); // Log the full response here

        const userName = data.name && typeof data.name === 'object' ? data.name.name : data.name; // Access 'name' inside the object if it's an object
        
        setUser({
          name: userName || 'Unknown User', // Set the name correctly or fallback to 'Unknown User'
        });
        setDonatedResources(data.donatedResources || []);
        setRequestedResources(data.requestedResources || []);

        // Fetch donors for requested resources and requesters for donated resources
        fetchDonorsForRequestedResources(data.requestedResources);
        fetchRequestersForDonatedResources(data.donatedResources);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false); // Ensure loading is false after fetching
    }
  };

  const fetchDonorsForRequestedResources = async () => {
    try {
      const response = await fetch(`http://localhost:5000/resources/donors/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
  
      const updatedDonors = data.map((resource) => ({
        ...resource,
        donors: resource.donors.map((donor) => ({
          ...donor,
          donatedAt: new Date(donor.donatedAt).toLocaleString(), // Format the donation date
        })),
      }));
  
      setDonorsForRequestedResources(updatedDonors);
    } catch (error) {
      console.error("Error fetching donors for requested resources:", error);
    }
  };
  
  
  

  const fetchRequestersForDonatedResources = async (donatedResources) => {
    try {
      const requesters = await Promise.all(
        donatedResources.map(async (resource) => {
          const response = await fetch(`http://localhost:5000/resources/requesters/${resource._id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await response.json();
          console.log("Requesters Data:", data); // Check the structure of the response

          return {
            resourceName: resource.resourceName,
            resourceId: resource._id,
            requesters: data.requesters || []  // Ensure requestDate exists
          };
        })
      );
      setRequestersForDonatedResources(requesters);
    } catch (error) {
      console.error('Error fetching requesters for donated resources:', error);
    }
  };

  const fetchAcceptedRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/accepted/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setAcceptedRequests(data);
    } catch (error) {
      console.error('Error fetching accepted requests:', error);
    }
  };

  const fetchRejectedRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/rejected/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      setRejectedRequests(data);
    } catch (error) {
      console.error('Error fetching rejected requests:', error);
    }
  };
  
  
  

  const handleAccept = async (resourceId, requesterId) => {
    try {
        const response = await fetch(`http://localhost:5000/accept-request/${resourceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ requesterId }),
        });

        if (response.ok) {
            alert('Request accepted and stored in ResourceAccepted schema!');
            // Remove the requester from the list after accepting
            setRequestersForDonatedResources((prev) =>
              prev.map((resource) =>
                resource.resourceId === resourceId
                  ? {
                      ...resource,
                      requesters: resource.requesters.filter((req) => req._id !== requesterId),
                    }
                  : resource
              )
            );
            // Refresh accepted requests
            fetchAcceptedRequests();
        } else {
            alert('Failed to accept request.');
        }
    } catch (error) {
        console.error('Error accepting request:', error);
    }
};


const handleReject = async (resourceId, requesterId) => {
    try {
        const response = await fetch(`http://localhost:5000/reject-request/${resourceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ requesterId }),
        });

        if (response.ok) {
            alert('Request rejected and stored in ResourceRejected schema!');
            // Remove the requester from the list after rejecting
            setRequestersForDonatedResources((prev) =>
              prev.map((resource) =>
                resource.resourceId === resourceId
                  ? {
                      ...resource,
                      requesters: resource.requesters.filter((req) => req._id !== requesterId),
                    }
                  : resource
              )
            );
            // Refresh rejected requests
            fetchRejectedRequests();
        } else {
            alert('Failed to reject request.');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
    }
};

  


  

  const handleChatClick = async (donorId, donorName) => {
    try {
      const response = await fetch('http://localhost:5000/chat/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          recipientId: donorId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        navigate(`/chat/${chatId}`); // Use the actual chatId here
      } else {
        alert('Failed to start chat');
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };
  
  

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    setIsEditModalOpen(false);
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>; // Show loading state
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src="default-profile-pic.jpg" // Default image
          alt="Profile"
          className="profile-pic"
        />
        <div className="profile-info">
          <h1>{user.name}</h1> {/* Now safely renders the full name */}
          <button onClick={openEditModal} className="edit-profile-button">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="resources-section">
        <h2>Requested Resources</h2>
        <div className="resource-list">
          {requestedResources.length > 0 ? (
            requestedResources.map((resource) => (
              <div key={resource._id} className="resource-item">
                <img
                  src={`http://localhost:5000${resource.image || 'placeholder-image.jpg'}`} 
                  alt={resource.resourceName}
                  className="resource-image"
                />
                <p>Resource Name: {resource.resourceName}</p>
                <p>Quantity: {resource.quantity}</p>
                <p>Location: {resource.location}</p>
              </div>
            ))
          ) : (
            <p>No requested resources found.</p>
          )}
        </div>
      </div>

      <div className="resources-section">
        <h2>Donated Resources</h2>
        <div className="resource-list">
          {donatedResources.length > 0 ? (
            donatedResources.map((resource) => (
              <div key={resource._id} className="resource-item">
                <img 
                  src={`http://localhost:5000${resource.image[0]}`} 
                  alt={resource.resourceName} 
                  className="resource-image" 
                />
                <p>Resource Name: {resource.resourceName}</p>
                <p>Quantity: {resource.quantity}</p>
                <p>Category: {resource.category}</p>
                <p>Location: {resource.location}</p>
              </div>
            ))
          ) : (
            <p>No donated resources found.</p>
          )}
        </div>
      </div>

      <div className="dropdown-container">
  <select onChange={(e) => setSelectedView(e.target.value)} value={selectedView}>
    <option value="donors">Donors for Requested Resources</option>
    <option value="requesters">Requesters for Donated Resources</option>
    <option value="accepted">Accepted Resources</option>
    <option value="rejected">Rejected Resources</option>
  </select>
</div>

{selectedView === 'donors' && (
  <div className="resources-section">
    <h2>Donors for Requested Resources</h2>
    <div className="resource-list">
      {donorsForRequestedResources.length > 0 ? (
        donorsForRequestedResources.map((resource) => (
          <div key={resource.resourceName} className="resource-item">
            <h3>{resource.resourceName}</h3>
            {resource.donors.length > 0 ? (
              resource.donors.map((donor) => (
                <div key={donor._id}>
                  <p>{donor.name}</p>
                  <p>Donated On: {donor.donatedAt}</p>
                  <button onClick={() => handleChatClick(donor._id)} className="chat-button">
                    Chat
                  </button>
                </div>
              ))
            ) : (
              <p>No donors found.</p>
            )}
          </div>
        ))
      ) : (
        <p>No donors for requested resources found.</p>
      )}
    </div>
  </div>
)}

{selectedView === 'requesters' && (
  <div className="resources-section">
    <h2>Requesters for Donated Resources</h2>
    <div className="resource-list">
      {requestersForDonatedResources.length > 0 ? (
        requestersForDonatedResources.map((resource) => (
          <div key={resource.resourceName} className="resource-item">
            <h3>{resource.resourceName}</h3>
            {resource.requesters.length > 0 ? (
              resource.requesters.map((requester) => (
                <div key={requester._id} className="requester-card">
                  <p>Name: {requester.name}</p>
                  <p>Requested On: {new Date(requester.requestedAt).toLocaleString()}</p>
                  <button onClick={() => handleAccept(resource._id, requester._id)} className="accept-button">
                    Accept
                  </button>
                  <button onClick={() => handleReject(resource._id, requester._id)} className="reject-button">
                    Reject
                  </button>
                </div>
              ))
            ) : (
              <p>No requesters found.</p>
            )}
          </div>
        ))
      ) : (
        <p>No requesters for donated resources found.</p>
      )}
    </div>
  </div>
)}

{selectedView === 'accepted' && (
        <div className="resources-section">
          <h2>Accepted Requests</h2>
          <div className="resource-list">
            {acceptedRequests.length > 0 ? (
              acceptedRequests.map((request) => (
                <div key={request._id} className="resource-item">
                  <p>Requester: {request.requesterId}</p>
                  <p>Resource: {request.resourceId}</p>
                </div>
              ))
            ) : (
              <p>No accepted requests found.</p>
            )}
          </div>
        </div>
      )}

      {selectedView === 'rejected' && (
        <div className="resources-section">
          <h2>Rejected Requests</h2>
          <div className="resource-list">
            {rejectedRequests.length > 0 ? (
              rejectedRequests.map((request) => (
                <div key={request._id} className="resource-item">
                  <p>Requester: {request.requesterId}</p>
                  <p>Resource: {request.resourceId}</p>
                </div>
              ))
            ) : (
              <p>No rejected requests found.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <ProfileEdit user={user} onUpdateUser={handleUpdateUser} onClose={() => setIsEditModalOpen(false)} />
      )}
    </div>
  );
}

export default UserProfile;
