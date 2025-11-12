import { useState } from "react";
import "./App.css";
import Navbar from "./components/navbar/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ListResource from "./pages/ListResource.jsx";
import RequestResources from "./pages/RequestResources.jsx";
import Contact from "./pages/Contact.jsx";
import Cart from "./pages/Cart.jsx";
import Resource from "./pages/Resource.jsx";
import Login from "./pages/LoginSignup.jsx";
import ReqResource from "./pages/ReqResource.jsx";
import Footer from "./components/footer/Footer.jsx";
// import Signup from './components/loginSignup/Signup.jsx'
import LoginSignup from "./pages/LoginSignup.jsx";
import Chat from "./pages/Chat.jsx";
// import { GoogleOAuthProvider } from '@react-oauth/google'
import Map from "./pages/Map.jsx";
import Profile from "./pages/Profile.jsx";
import ProfileEdit from "./components/profileEdit/ProfileEdit.jsx";
import ResourceDetail from "./pages/ResourceDetail.jsx";
import LandingPage from "./components/landingpage/LandingPage.jsx";
import Admin from "./pages/Admin.jsx";
// import ProtectedRoute from './components/ProtctedRoute/ProtectedRoute.jsx'
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotificationPage from "./pages/NotificationPage.jsx";

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };
  return (
    <>
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]"></div>
      <Navbar />

      <Routes>
        {/* <Route path='/' element={<LandingPage/>}/> */}
        <Route path="/" element={<Home />} />
        <Route path="/list-resource" element={<ListResource />} />
        <Route path="/request-resource" element={<RequestResources />} />
        <Route path="/contact-us" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/resource/:resourceId" element={<Resource />} />
        <Route path="/login" element={<LoginSignup />} />
        {/* <Route path='/signup' element={<LoginSignup/>}/> */}
        <Route path="/ReqResource" element={<ReqResource />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/map" element={<Map />} />
        <Route path="/profile/" element={<Profile />} />
        <Route path="/edit-profile" element={<ProfileEdit />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/resource/:resourceId" element={<ResourceDetail />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;

// MAP API KEY : AIzaSyAE9B1b_OBK4EwIfZIr6ChdoqF4Zt4-bJQ
