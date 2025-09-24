import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/splashscreen";
import LoginScreen from "./pages/loginscreen";
import SignupPage from "./pages/signuppage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* ...other routes... */}
      </Routes>
    </Router>
  );
}

export default App;