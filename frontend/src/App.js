import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/splashscreen";
import LoginScreen from "./pages/loginscreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        {/* ...other routes... */}
      </Routes>
    </Router>
  );
}

export default App;
