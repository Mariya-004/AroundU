import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/splashscreen";
import LoginScreen from "./pages/loginscreen";
import SignupPage from "./pages/signuppage";
import CustomerDashboard from "./pages/customerdashboard";
import ShopkeeperDashboard from "./pages/shopkeeperdashboard";
import DeliveryAgentDashboard from "./pages/deliveryagentdashboard";
import ShopkeeperProfileSetup from "./pages/shopkeepersetprofile";
import DeliveryAgentProfileSetup from "./pages/deliveryagentsetprofile";
import CustomerProfile from "./pages/customerProfile";
import CustomerMap from "./pages/customermap"; // Uncomment if using the map page
import AddProduct from "./pages/addProduct";
import ShopProductList from "./pages/shopproductsview";
import ShopkeeperEditProducts from "./pages/editProduct";
import SearchResultsPage from "./pages/SearchResultsPage";
import ShopProductsPage from "./pages/shopProductsPage";
import CustomerCartPage from "./pages/CustomerCartPage";
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
        <Route path="/shopkeeper-setup-profile" element={<ShopkeeperProfileSetup />} />
        <Route path="/deliveryagent-setprofile" element={<DeliveryAgentProfileSetup />} />
        <Route path="/customer-profile" element={<CustomerProfile />} />
        <Route path="/customer-map" element={<CustomerMap />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/shop-products" element={<ShopProductList />} />
        <Route path="/edit-product/:shopId/:productId" element={<ShopkeeperEditProducts />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/shop/:shopId" element={<ShopProductsPage />} />
        <Route path="/cart" element={<CustomerCartPage />} />

        {/* ...other routes... */}
      </Routes>
    </Router>
  );
}

export default App;