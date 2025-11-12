// backend/server.js
const express = require("express");
const connectDB = require("./config/db");
const User = require("./models/users");
const Donation = require("./models/Donation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const authenticate = require("./middleware/authenticate"); // Include the authentication middleware
const RequestedResource = require("./models/RequestedResource"); // Import the requested resource model
const UserRequestedResource = require("./models/UserRequestResoure");
// const Chat = require("./models/Chat");
const Contact = require("./models/Contact");
const UserDonatedResource = require("./models/UserDonatedResource");
const { Chat, Message } = require('./models/Chat');
const RequestAccepted = require('./models/RequestAccept');
const RequestRejected = require('./models/RequestReject');

require("dotenv").config();

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const RequestReject = require("./models/RequestReject");

// Create HTTP server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow requests from any origin
    methods: ["GET", "POST"],
  },
});

// Middleware for parsing JSON
app.use(express.json({ extended: false }));
require("dotenv").config();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set up file upload with Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure uploads/ folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Create an upload instance using the storage configuration
const upload = multer({ storage: storage });

// Routes


// Chat functionality
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join room after verifying if users are eligible to chat (donation or request made)
  socket.on("joinRoom", async ({ roomId, userId }) => {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return socket.emit("error", { message: "User not found" });
      }

      // Check if the user has donated or requested a resource
      const hasDonated = await Donation.exists({ userId: userId });
      const hasRequested = await UserRequestedResource.exists({
        userId: userId,
      });

      // Check if user has donated or requested a resource
      if (!hasDonated && !hasRequested) {
        return socket.emit("error", {
          message: "You are not eligible to chat",
        });
      }

      // User is eligible to chat, so join the room
      socket.join(roomId);
      console.log(`${userId} joined room: ${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", { message: "Internal server error" });
    }
  });

  // Handle sending messages in the chat
  socket.on("sendMessage", async ({ roomId, message, senderId }) => {
    try {
      // Ensure the sender is eligible to send a message (i.e., has donated or requested)
      const hasDonated = await Donation.exists({ userId: senderId });
      const hasRequested = await UserRequestedResource.exists({
        userId: senderId,
      });

      if (!hasDonated && !hasRequested) {
        return socket.emit("error", {
          message: "You are not allowed to send a message",
        });
      }

      const messageData = {
        roomId,
        senderId,
        message,
        timestamp: new Date(),
      };

      // Emit the message to all users in the room
      io.to(roomId).emit("receiveMessage", messageData);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Internal server error" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// POST route for donation
app.post("/donate", upload.array("images", 5), async (req, res) => {
  try {
    console.log("Received Files:", req.files); // Debugging log
    const { resourceName, quantity, category, description, location, userId } =
      req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`); // Map file paths
    console.log("Image Paths:", imagePaths); // Debugging log

    const newDonation = new Donation({
      resourceName,
      quantity,
      category,
      description,
      location,
      image: imagePaths,
      userId,
    });

    await newDonation.save();
    res
      .status(201)
      .json({ message: "Donation successful", donation: newDonation });
  } catch (error) {
    console.error("Error in Donation Route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// GET route to fetch all donated resources
app.get("/donatedResources", async (req, res) => {
  try {
    const donatedResources = await Donation.find().populate(
      "userId",
      "name email"
    ); // Retrieve all donated resources from the DB

    if (!donatedResources) {
      return res.status(404).json({ message: "No donated resources found." });
    }
    res.status(200).json(donatedResources);
  } catch (err) {
    console.error("Error fetching donated resources:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Attempt to find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Attempt password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Attempt JWT generation (check for JWT_SECRET in .env)
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env file");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const id = user._id;

    res.status(200).json({ message: "Login successful", token, id });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Signup route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// User Profile Route
app.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId); // Fetch user data by ID
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch donated resources
    const donate_data = await Donation.find({ userId: req.params.userId });

    // Fetch requested resources and populate resourceId
    const requested_data = await UserRequestedResource.find({ userId: req.params.userId })
      .populate('resourceId') // Populate resourceId with full donation data
      .populate('donorId', 'name') // Optionally populate donor information
      .populate('userId', 'name'); // Optionally populate user information

    res.json({
      name: user.name,  // Returning user name
      donatedResources: donate_data || [],
      requestedResources: requested_data || [],
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Route to fetch accepted requests for a user
app.get('/accepted/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Fetch accepted resources by the userId
    const acceptedResources = await RequestAccepted.find({ requesterId: userId })
      .populate('resourceId', 'resourceName quantity location category') // Populate the resource details
      .populate('requesterId', 'name'); // Populate the requester's details
    
    if (acceptedResources.length === 0) {
      return res.status(404).json({ message: 'No accepted requests found.' });
    }
    
    res.status(200).json(acceptedResources);
  } catch (error) {
    console.error('Error fetching accepted requests:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Route to fetch rejected requests for a user
app.get('/rejected/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Fetch rejected resources by the userId
    const rejectedResources = await RequestReject.find({ requesterId: userId })
      .populate('resourceId', 'resourceName quantity location category') // Populate the resource details
      .populate('requesterId', 'name'); // Populate the requester's details
    
    if (rejectedResources.length === 0) {
      return res.status(404).json({ message: 'No rejected requests found.' });
    }
    
    res.status(200).json(rejectedResources);
  } catch (error) {
    console.error('Error fetching rejected requests:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});


// PUT route to update user's profile (name, profilePic)
app.put(
  "/profile",
  authenticate,
  upload.single("profilePic"),
  async (req, res) => {
    const { name } = req.body;
    let profilePic = req.file ? `/uploads/${req.file.filename}` : undefined; // Handle profile picture if uploaded

    try {
      const user = req.user; // User is attached to the request object by the authenticate middleware

      if (name) user.name = name; // Update name if provided
      if (profilePic) user.profilePic = profilePic; // Update profilePic if a new image is uploaded

      await user.save();

      res.status(200).json({ message: "Profile updated successfully", user });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);




// Route to handle storing the donated resource from the requested card
app.post("/donate-resource/:resourceId",authenticate,async(req,res)=>{
  
  const { resourceId } = req.params; // Get resourceId from the URL parameter
  const { userId } = req.user; // Get the requesterId from the authenticated user
  
  // console.log("id" + userId);
  try {
    // Validate that the resource exists
    const resource = await RequestedResource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }
    console.log(resource);

    // Prevent users from requesting their own donated resources
    if (resource.userId.toString() === userId.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot donate your own requested resource." });
    }

    // Ensure the user hasn't already requested the same resource
    const existingRequest = await UserDonatedResource.findOne({
      resourceId: resourceId,
      userId: userId,
    });

    console.log("existing" + existingRequest);

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "You have already donated this resource." });
    }

     // Initialize requestedBy as an empty array if it's undefined
     if (!resource.requestedBy) {
      resource.requestedBy = [];
    }

    resource.requestedBy.push({ userId });

    // Save the updated resource in the database
    await resource.save();

    console.log("userid" + userId);
    // Create the resource request
    const newRequest = new UserDonatedResource({
      donorId: resource.userId,  // The user who originally donated the resource
      requestedResourceId: resourceId,  // Reference to the requested resource
      resourceName: resource.resourceName,
      category: resource.category,
      description: resource.description,
      image: resource.image,  // Assuming resource.image is an array of image URLs
    });

    console.log("newRequest" + newRequest);

    await newRequest.save(); // Save the new request to the database

    res.status(201).json({
      message: "Resource donated submitted successfully.",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error during resource request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Route to fetch all requested resources
// GET route to fetch all requested resources for the logged-in user
app.get("/requestedResources", async (req, res) => {
  try {
    const getRequestedResource = await RequestedResource.find().populate(
      "userId",
      "name email"
    );

    // console.log("Requested Resources:", getRequestedResource); // Debugging log

    if (!getRequestedResource || getRequestedResource.length === 0) {
      return res.status(404).json({ message: "No requested resources found." });
    }
    res.status(200).json(getRequestedResource);
  } catch (err) {
    console.error("Error fetching requested resources:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




// Request a resource from donation
// POST /request-resource/:resourceId
app.get("/request-resource/:resourceId", authenticate, async (req, res) => {
  // console.log("hiii" + req.user);
  const { resourceId } = req.params; // Get resourceId from the URL parameter
  const { userId } = req.user; // Get the requesterId from the authenticated user

  // console.log("id" + userId);
  try {
    // Validate that the resource exists
    const resource = await Donation.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }
    console.log(resource);

    // Prevent users from requesting their own donated resources
    if (resource.userId.toString() === userId.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot request your own donated resource." });
    }

    // Ensure the user hasn't already requested the same resource
    const existingRequest = await UserRequestedResource.findOne({
      resourceId: resourceId,
      userId: userId,
    });

    console.log("existing" + existingRequest);

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "You have already requested this resource." });
    }

    resource.requestedBy.push({ userId });

    // Save the updated resource in the database
    await resource.save();

    console.log("userid" + userId);
    // Create the resource request
    const newRequest = new UserRequestedResource({
      donorId: resource.userId,
      userId: userId,
      resourceId: resourceId,
      resourceName: resource.resourceName,
      category: resource.category,
      description: resource.description,
      image: resource.image,
      requestDate: new Date(), // Explicitly set the date
    });

    console.log("newRequest" + newRequest);

    await newRequest.save(); // Save the new request to the database

    res.status(201).json({
      message: "Resource request submitted successfully.",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error during resource request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});



// Get all resources requested by the logged-in user
app.get("/user-requested-resources", authenticate, async (req, res) => {
  try {
    const requests = await UserRequestedResource.find({
      requesterId: req.user._id,
    })
      .populate("resourceId")
      .populate("donorId", "name email");

    if (!requests.length) {
      return res.status(404).json({ message: "No requested resources found." });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requested resources:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});



// GET route to fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Retrieve all users
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// DELETE route to remove a donated resource
app.delete("/donatedResources/:id", async (req, res) => {
  try {
    const resourceId = req.params.id;
    const deletedResource = await Donation.findByIdAndDelete(resourceId);

    if (!deletedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.status(200).json({ message: "Resource removed successfully" });
  } catch (err) {
    console.error("Error removing resource:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// DELETE route to remove a user
app.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User removed successfully" });
  } catch (err) {
    console.error("Error removing user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Route to handle contact form submissions
// Route to handle contact form submission
app.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  try {
    // Save the contact details to the database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // Send success response
    res.status(200).json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: "There was an error processing your request." });
  }
});


// Endpoint to get all contact form submissions
app.get("/contact", async (req, res) => {
  try {
    const contacts = await Contact.find(); // Fetch all contact form submissions
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: "There was an error fetching contact data." });
  }
});


// Update user's profile (name, profilePic)
app.put(
  "/profile",
  authenticate,
  upload.single("profilePic"),
  async (req, res) => {
    const { name } = req.body;
    let profilePic = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (name) user.name = name;
      if (profilePic) user.profilePic = profilePic;

      await user.save();

      res.status(200).json({ message: "Profile updated successfully", user });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);



// Cart route to fetch requested resources for the logged-in user
// app.get("/cart", async (req, res) => {
//   try {
//     // You can hard-code the userId for testing, or fetch it from the session or query parameters
//     const userId = req.query.userId || "some-user-id"; // Replace this with dynamic logic

//     // Fetch requested resources for the user
//     const cartItems = await UserRequestedResource.find({ userId })
//       .populate({
//         path: "donorId",
//         select: "name location", // Fetch donor's name and location
//       })
//       .populate({
//         path: "resourceId",
//         select: "createdAt", // Fetch resource creation date
//       });

//     // Transforming data to return specific fields
//     const formattedCart = cartItems.map((item) => ({
//       resourceName: item.resourceName,
//       image: item.image,
//       donorName: item.donorId.name || "Unknown Donor",
//       location: item.donorId.location || "Unknown Location",
//       requestDate: item.resourceId.createdAt || item.requestDate,
//     }));

//     res.status(200).json({ success: true, cart: formattedCart });
//   } catch (error) {
//     console.error("Error fetching cart data:", error);
//     res.status(500).json({ success: false, message: "Failed to fetch cart data" });
//   }
// });



// Backend route for cart
app.get("/cart", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Fetch the cart items and populate the donorId field with the donor's name
    const cartItems = await UserRequestedResource.find({ userId })
      .populate({
        path: 'donorId', // Field to populate
        select: 'name', // Specify which fields of the User model you want to include
      })
      .exec();

    // Check if cartItems is empty
    if (cartItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No cart items found' });
    }

    // Send the cart items with donor names
    const formattedCartItems = cartItems.map(item => ({
      ...item.toObject(),
      donorName: item.donorId.name, // Add donorName to each item
    }));

    res.json({
      success: true,
      cart: formattedCartItems, // Send formatted cart items
    });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// Endpoint to get requesters for a donated resource
app.get('/resources/requesters/:resourceId', async (req, res) => {
  const { resourceId } = req.params;

  try {
    // Fetch all UserRequestedResource documents that reference the given resourceId
    const requestedResources = await UserRequestedResource.find({ resourceId })
      .populate('userId', 'name') // Populate user information (name)
      .exec();

    // Extract the requesters and send them as the response
    const requesters = requestedResources.map((request) => ({
      _id: request.userId._id,
      name: request.userId.name,
    }));

    res.status(200).json({ requesters });
  } catch (error) {
    console.error("Error fetching requesters:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Route to fetch donors for requested resources
app.get("/resources/donors/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all resources requested by the user
    const requestedResources = await UserRequestedResource.find({ userId });

    // Fetch the donors and donation date for each requested resource
    const donors = await Promise.all(
      requestedResources.map(async (resource) => {
        const donation = await Donation.findById(resource.resourceId)
          .populate("userId", "name")
          .lean(); // Use `lean` for plain JS objects

        return {
          resourceName: resource.resourceName,
          donors: donation
            ? [
                {
                  name: donation.userId.name,
                  _id: donation.userId._id,
                  donatedAt: donation.createdAt, // Include the donation date
                },
              ]
            : [],
        };
      })
    );

    res.status(200).json(donors);
  } catch (error) {
    console.error("Error fetching donors for requested resources:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Accept a request
// Accept Resource Request
app.post('/accept-request/:resourceId', authenticate, async (req, res) => {
  const { resourceId } = req.params;
  const { requesterId } = req.body;

  try {
      const resourceAccepted = new RequestAccepted({
          resourceId,
          requesterId,
          acceptedAt: new Date(),
      });

      await resourceAccepted.save();
      res.status(200).json({ message: 'Request accepted successfully' });
  } catch (error) {
      console.error('Error accepting resource:', error);
      res.status(500).json({ error: 'Failed to accept the request' });
  }
});



app.post('/reject-request/:resourceId', authenticate, async (req, res) => {
  const { resourceId } = req.params;
  const { requesterId } = req.body;

  try {
      const resourceRejected = new RequestRejected({
          resourceId,
          requesterId,
          rejectedAt: new Date(),
      });

      await resourceRejected.save();
      res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) {
      console.error('Error rejecting resource:', error);
      res.status(500).json({ error: 'Failed to reject the request' });
  }
});




// Remove the resource in the cart
app.delete("/cart/remove/:id",authenticate, async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const { userId } = req.body; // Get userId from the body

    if (!cartItemId || !userId) {
      return res.status(400).json({ success: false, message: "Missing item or user ID" });
    }

    // Find and remove the cart item if it matches the userId
    const result = await UserRequestedResource.findOneAndDelete({ _id: cartItemId, userId });

    if (!result) {
      return res.status(404).json({ success: false, message: "Cart item not found or does not belong to user" });
    }

    res.status(200).json({ success: true, message: "Item removed successfully" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});



// Chatting :
// Route to initiate a chat between two users
// app.post('/chat/initiate', async (req, res) => {
//   const { userId, recipientId } = req.body;
  
//   try {
//     const existingChat = await Chat.findOne({ users: { $all: [userId, recipientId] } });
    
//     if (existingChat) {
//       return res.json({ chatId: existingChat._id });
//     }

//     const newChat = new Chat({
//       users: [userId, recipientId],
//       messages: [],
//     });
    
//     await newChat.save();
//     res.json({ chatId: newChat._id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error starting chat');
//   }
// });

// // Save messages in the chat
// app.post('/chat/message', async (req, res) => {
//   const { chatId, senderId, text } = req.body;
  
//   try {
//     const chat = await Chat.findById(chatId);
    
//     if (!chat) {
//       return res.status(404).send('Chat not found');
//     }

//     chat.messages.push({
//       sender: senderId,
//       text,
//     });
    
//     await chat.save();
//     res.status(200).send('Message sent');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error saving message');
//   }
// });

// app.get('/chat/:chatId', async (req, res) => {
//   const { chatId } = req.params;
  
//   try {
//     const chat = await Chat.findById(chatId).populate('messages.sender', 'name');
    
//     if (!chat) {
//       return res.status(404).send('Chat not found');
//     }
    
//     res.json(chat);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error fetching chat');
//   }
// });

// // GET /chats - Fetch chats that involve the logged-in user
// app.get('/chats', async (req, res) => {
//   const userId = req.user.id; // Get user ID from token
  
//   try {
//     const chats = await Chat.find({ users: userId }).populate('users', 'name');
//     res.json(chats);
//   } catch (error) {
//     console.error('Error fetching chats:', error);
//     res.status(500).send('Error fetching chats');
//   }
// });


// Initiate a chat between users
app.post('/initiate', async (req, res) => {
  const { userId, recipientId } = req.body;
  try {
    const chat = new Chat({
      participants: [userId, recipientId],
      messages: [],
    });
    await chat.save();
    res.status(201).json({ chatId: chat._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate chat' });
  }
});

// Send a message in a chat
app.post('/send', async (req, res) => {
  const { chatId, userId, message } = req.body;
  try {
    const chat = await Chat.findById(chatId);
    const newMessage = new Message({
      sender: userId,
      text: message,
    });
    chat.messages.push(newMessage);
    await chat.save();
    res.status(200).send('Message sent');
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Fetch chat messages
app.get('/:chatId', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('messages.sender', 'name');
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.status(200).json({
      recipientName: chat.participants.find((id) => id !== req.userId), // Find recipient's name
      messages: chat.messages,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Fetch chat history
app.get('/history/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.params.userId })
      .populate('participants', 'name')
      .populate('messages', 'text sender timestamp')
      .sort({ 'messages.timestamp': -1 })
      .limit(5); // Limit to last 5 chats
    res.status(200).json(
      chats.map((chat) => ({
        chatId: chat._id,
        recipientName: chat.participants.find((p) => p._id.toString() !== req.params.userId).name,
        lastMessage: chat.messages[chat.messages.length - 1]?.text || 'No messages',
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});


// GET /chats/:chatId/messages - Fetch all messages for a specific chat
app.get('/chats/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const messages = await Message.find({ chatId }).populate('senderId', 'name');
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Error fetching messages');
  }
});

// POST /chats/:chatId/messages - Send a new message in a chat
app.post('/chats/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const { text, senderId } = req.body;

  try {
    const newMessage = new Message({
      chatId,
      text,
      senderId,
      sentAt: new Date(),
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending message');
  }
});





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});