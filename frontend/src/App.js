import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/splashscreen";
import SignUp from "./pages/signuppage";// your signup component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/signup" element={<SignUp />} /> 
      </Routes>
    </Router>
  );
}

export default App;
