import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --- Styles & Constants ---
const primaryColor = "#144139"; // Dark green
const secondaryColor = "#C8A46B"; // Gold/brown
const whiteBg = "#fff";
const neutralBg = "#f9f9f9";
const borderColor = "#e0e0e0";
const dangerColor = "#dc3545"; // Red for errors

const SEARCH_API_ENDPOINT = "https://asia-south1-aroundu-473113.cloudfunctions.net/search_item";
const CUSTOMER_FEED_API = "https://asia-south1-aroundu-473113.cloudfunctions.net/customer-feed";

// Re-using styles from the original dashboard
const actionBtnStyle = {
  padding: "10px 15px",
  background: primaryColor,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.2s",
  marginRight: "10px",
};

const searchInputStyle = {
  width: "100%",
  padding: "12px 15px 12px 40px",
  borderRadius: "8px",
  border: `1px solid ${borderColor}`,
  fontSize: "1rem",
  outline: "none",
  boxSizing: "border-box",
  background: `${whiteBg} url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>') no-repeat 10px center`,
  backgroundSize: "20px",
  marginBottom: "15px",
};

const shopListItemStyle = {
  background: whiteBg,
  borderRadius: "12px",
  padding: "15px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  marginBottom: "10px",
  cursor: "pointer",
  border: `1px solid ${borderColor}`,
};

const shopListImageStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "8px",
  objectFit: "cover",
  flexShrink: 0,
  // Placeholder styling instead of an actual image URL
  background: neutralBg,
  border: `1px solid ${borderColor}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '0.7rem',
  color: primaryColor,
  fontWeight: 'bold',
};
// --- End Styles & Constants ---


export default function CustomerDashboard() {
  const navigate = useNavigate();
  
  // --- State for Data and UI ---
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for fetching nearby shops
  const [nearbyShops, setNearbyShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [shopFetchError, setShopFetchError] = useState(null);

  const userName = user?.name || "Customer";
  
  // --- Data Fetching Logic (Customer Feed) ---
  useEffect(() => {
    const fetchCustomerDataAndShops = async () => {
      // ... (Existing shop/feed fetching logic remains the same) ...
      try {
        setLoadingShops(true);
        setShopFetchError(null);

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found. Please log in.");
        
        // 1. Fetch Customer Feed (Profile & Initial Shops based on saved location)
        const res = await fetch(CUSTOMER_FEED_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || `Error fetching feed: ${res.status}`);
        }

        const data = await res.json();
        // Update local user info if necessary
        if (data.customerProfile?.name) {
            setUser(prev => ({ ...prev, name: data.customerProfile.name }));
        }
        
        // Use the fetched shops
        if (data.shops && Array.isArray(data.shops)) {
            setNearbyShops(data.shops);
        }

      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setShopFetchError(err.message);
      } finally {
        setLoadingShops(false);
      }
    };

    fetchCustomerDataAndShops();
  }, []);


  // --- UPDATED SEARCH LOGIC ---
  
  /**
   * Fetches search results and immediately navigates to a dedicated page
   * upon successful fetch, passing the query as a URL parameter.
   */
  const handleDirectSearch = (query) => {
    if (query.trim() === "") return;

    // Use URL query parameter for search page to trigger API call there
    // This simplifies the dashboard by removing the need to manage search results here.
    navigate(`/search-results?query=${encodeURIComponent(query.trim())}`);
  };

  // Debounce the search input to limit search navigation/API calls
  useEffect(() => {
    // Only trigger search on Enter key or if we were to use an external search button.
    // Since we are using an input field and the user might be typing, we'll
    // only trigger the navigation on the **Enter key** event (as implemented below) 
    // or through a separate search button click, and not on every keystroke.
    
    // REMOVING THE DEBOUNCE on key stroke here to prevent navigating away while typing.
    // The search is now triggered explicitly by the user (e.g., hitting Enter).
    
    // To respect the previous debounce pattern, we can treat this useEffect
    // as an implicit "Search on input change is NOT supported" indicator. 
    // We will rely on the Enter key press.
    
    return () => {}; // Cleanup is empty now
  }, []); // No dependency on searchQuery here

  // Handler for Enter key press on search input
  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault(); // Prevent form submission if applicable
          handleDirectSearch(searchQuery);
      }
  };

  // --- Navigation Handlers ---
  const handleProfileSetup = () => {
    navigate("/customer-profile");
  };

  const handleViewMap = () => {
    navigate("/customer-map");
  };
  
  const handleShopClick = (shopId) => {
    navigate(`/shop/${shopId}`); 
  };
  
  const getInitials = (name) => {
    return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  

  return (
    <div
      style={{
        background: neutralBg,
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "'Poppins', sans-serif",
        color: primaryColor,
      }}
    >
      {/* Header and Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "30px" }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>
          Hi {userName.split(' ')[0]} 👋
        </h1>
        
        {/* Actions - View Map & Profile Icon */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* View Map Button */}
          <button
            style={{ ...actionBtnStyle, background: primaryColor, padding: "10px 18px" }}
            onClick={handleViewMap}
          >
            View Map
          </button>
          
          {/* Profile Logo/Icon */}
          <div 
              style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: secondaryColor,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: primaryColor,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onClick={handleProfileSetup}
          >
              {getInitials(userName)}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>What are you looking for today?</h3>
        
        {/* Search Input - Added onKeyDown for Enter key submission */}
        <input
          type="text"
          placeholder="Search for items, shops, or categories..."
          style={searchInputStyle}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Optional: Add a Search Button here for explicit submission if Enter key isn't ideal */}
        <button
            style={{ ...actionBtnStyle, padding: "12px 20px" }}
            onClick={() => handleDirectSearch(searchQuery)}
        >
            Search
        </button>
      </div>

      {/* Search Results Display Area is REMOVED to force navigation */}
      {/* If searchQuery.length > 0 was used to show results, that section is now gone. */}
      
      {/* Nearby Shops Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "15px", color: primaryColor }}>Nearby Shops</h2>
        
        {loadingShops && <p style={{ color: "#555" }}>Loading nearby shops...</p>}
        {shopFetchError && <p style={{ color: dangerColor, fontWeight: "bold" }}>Error loading shops: {shopFetchError}</p>}
        
        {!loadingShops && nearbyShops.length === 0 && !shopFetchError && (
             <p style={{ color: "#777" }}>No nearby shops found based on your delivery location.</p>
        )}
        
        {!loadingShops && nearbyShops.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {nearbyShops.map((shop) => (
              <div
                key={shop._id} // Use the API's shop ID
                style={shopListItemStyle}
                onClick={() => handleShopClick(shop._id)} // Navigate to shop detail
              >
                {/* Shop Image Placeholder */}
                <div style={shopListImageStyle}>
                    {getInitials(shop.name)}
                </div>
                
                {/* Shop Details */}
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "1.1rem", color: primaryColor }}>
                    {shop.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                    {shop.category || 'General Store'} 
                  </p>
                </div>

                {/* Rating and Distance */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: "600", color: secondaryColor }}>
                        ⭐ {shop.rating ? shop.rating.toFixed(1) : 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
                        {shop.distance ? `${shop.distance.toFixed(1)} km` : 'Near'}
                    </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Placeholder */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '12px', 
        textAlign: 'center',
        color: '#777'
      }}>
        <p style={{ margin: 0 }}>Dashboard elements like Order Tracking and Personalized Recommendations would be displayed here.</p>
      </div>
    </div>
  );
}