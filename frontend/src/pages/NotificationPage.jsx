import React, { useState, useEffect } from 'react';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications (this could be from an API or local state)
    // For demonstration, we're using a static array
    const fetchedNotifications = [
      { id: 1, message: ' All About the Notification .' },
      
    ];

    // Set the notifications state
    setNotifications(fetchedNotifications);
  }, []);

  return (
    <div className="notification-page">
      <h2>Notifications</h2>
      <ul className="notification-list">
        {Array.isArray(notifications) && notifications.length > 0 ? (
          notifications.map((notification) => (
            <li key={notification.id} className="notification-item">
              {notification.message}
            </li>
          ))
        ) : (
          <li className="notification-item">No new notifications</li>
        )}
      </ul>
    </div>
  );
};

export default NotificationPage;
