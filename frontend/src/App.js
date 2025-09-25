import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/splashscreen";
import LoginScreen from "./pages/loginscreen";
import SignupPage from "./pages/signuppage";
import CustomerDashboard from "./pages/customerdashboard";
import ShopkeeperDashboard from "./pages/shopkeeperdashboard";
import DeliveryAgentDashboard from "./pages/deliveryagentdashboard";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/shopkeeper-dashboard" element={<ShopkeeperDashboard />} />
        <Route path="/delivery-dashboard" element={<DeliveryAgentDashboard />} />
        {/* ...other routes... */}
      </Routes>
    </Router>
  );
}

export default App;