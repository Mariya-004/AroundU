import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Styles & Constants ---
const primaryColor = "#144139"; // Dark green
const secondaryColor = "#C8A46B"; // Gold/brown
const whiteBg = "#fff";
const neutralBg = "#f9f9f9";
const borderColor = "#e0e0e0";
const dangerColor = "#dc3545"; // Red for errors

const CUSTOMER_FEED_API = "https://asia-south1-aroundu-473113.cloudfunctions.net/customer-feed";

// Styles
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

const logoutBtnStyle = {
  ...actionBtnStyle,
  background: dangerColor, // Red for logout
  padding: "10px 18px",
  marginRight: "0",
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
  borderRadius: "8px",
  padding: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px",
  cursor: "pointer",
  border: `1px solid ${borderColor}`,
};

const shopListImageStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "6px",
  objectFit: "cover",
  flexShrink: 0,
  background: neutralBg,
  border: `1px solid ${borderColor}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '0.6rem',
  color: primaryColor,
  fontWeight: 'bold',
};

// --- Custom Icons for Leaflet ---
const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const liveIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7876/7876209.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
// --- End Icons & Styles ---


export default function CustomerGeoDashboard() {
  const navigate = useNavigate();
  const searchRadius = 5; // 5 km radius

  // --- State for Data and UI ---
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [searchQuery, setSearchQuery] = useState("");
  
  // Shop & Location State
  const [customerProfile, setCustomerProfile] = useState(null);
  const [shops, setShops] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [useLiveLocation, setUseLiveLocation] = useState(false); // Controls reference point
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.5276, 76.2144]); // Default center (Thrissur)

  const userName = user?.name || "Customer";
  
  // --- Utility & Handlers ---
  const getInitials = (name) => {
    return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login"); 
  };
  
  const handleProfileSetup = () => {
    navigate("/customer-profile");
  };
  
  const handleShopClick = (shopId) => {
    navigate(`/shop/${shopId}`); 
  };
  
  const handleDirectSearch = (query) => {
    if (query.trim() === "") return;
    // Navigate to a dedicated search page to handle the search API call
    navigate(`/search-results?query=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault(); 
          handleDirectSearch(searchQuery);
      }
  };

  // --- Core Data Fetching Logic ---
  
  // Function to fetch shops based on a given location
  const fetchShopsByLocation = async (latitude, longitude) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/nearby-shops?lat=${latitude}&lng=${longitude}&radius=${searchRadius}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.shops) setShops(data.shops);
      setMapCenter([latitude, longitude]); // Update map center to the search point
    } catch (err) {
      console.error("Error fetching shops by location:", err);
    }
  };

  // 1. Initial Load: Fetch Profile and Shops based on Saved Location
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found. Please log in.");
        
        const res = await fetch(CUSTOMER_FEED_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || `Error fetching feed: ${res.status}`);
        }

        const data = await res.json();
        setCustomerProfile(data.customerProfile);
        
        if (data.customerProfile?.name) {
            setUser(prev => ({ ...prev, name: data.customerProfile.name }));
        }

        // Use the fetched shops and set center to delivery location
        if (data.shops && Array.isArray(data.shops)) {
            setShops(data.shops);
        }
        if (data.customerProfile?.deliveryLocation?.coordinates) {
            const [lng, lat] = data.customerProfile.deliveryLocation.coordinates;
            setMapCenter([lat, lng]);
        }

      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Live Location Tracking & Conditional Shop Fetching
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLiveLocation([latitude, longitude]);

          // If live location mode is enabled, fetch shops based on current GPS
          if (useLiveLocation) {
             fetchShopsByLocation(latitude, longitude);
          }
        },
        (err) => console.warn("Live location denied:", err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );

      // Cleanup on unmount
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.warn("Geolocation not supported");
    }
  }, [useLiveLocation]); 
  
  // Determine the current point of reference for map/list display
  const referenceLocation = useLiveLocation && liveLocation ? liveLocation : mapCenter;
  const locationLabel = useLiveLocation ? "Live Location" : "Delivery Location";


  // --- Render UI ---
  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h2 style={{ color: primaryColor }}>Loading your Geo-Dashboard...</h2>
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: "20%", color: dangerColor }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  return (
    <div
      style={{
        background: neutralBg,
        minHeight: "100vh",
        fontFamily: "'Poppins', sans-serif",
        color: primaryColor,
      }}
    >
      {/* 1. Header, Greeting, and Actions */}
      <div style={{ padding: "20px 30px", background: whiteBg, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>
            Hi {userName.split(' ')[0]} 👋
          </h1>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* LOGOUT BUTTON */}
            <button
              style={logoutBtnStyle}
              onClick={handleLogout}
            >
              Logout
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
        <div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Search Nearby</h3>
          <input
            type="text"
            placeholder="Search for items, shops, or categories..."
            style={searchInputStyle}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
              style={{ ...actionBtnStyle, padding: "12px 20px" }}
              onClick={() => handleDirectSearch(searchQuery)}
          >
              Search
          </button>
        </div>
      </div>
      
      {/* 2. Map and Shop List - Arranged in Parallel */}
      <div style={{ display: "flex", height: "calc(100vh - 220px)", marginTop: "20px", padding: "0 20px" }}>
        
        {/* Left Panel: Shop List (35% width) */}
        <div 
          style={{ 
            width: "35%", 
            padding: "10px", 
            overflowY: "auto", 
            background: whiteBg,
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <h2 style={{ color: primaryColor, fontSize: "1.4rem", marginTop: 0, marginBottom: "10px" }}>
              Shops Near {locationLabel}
          </h2>
          
          {/* Toggle Button */}
          <button
            onClick={() => setUseLiveLocation(!useLiveLocation)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              backgroundColor: useLiveLocation ? secondaryColor : primaryColor,
              color: useLiveLocation ? primaryColor : "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "background 0.2s",
            }}
          >
            {useLiveLocation ? "📍 Using Live Location" : "🏠 Using Delivery Location"}
          </button>

          {shops.length === 0 ? (
              <p style={{color: '#777'}}>No shops found within {searchRadius} km of your location.</p>
          ) : (
              shops.map((shop) => (
                <div
                  key={shop._id}
                  style={shopListItemStyle}
                  onClick={() => handleShopClick(shop._id)}
                >
                  {/* Shop Image Placeholder */}
                  <div style={shopListImageStyle}>
                      {getInitials(shop.name)}
                  </div>
                  
                  {/* Shop Details - Corrected Category Display */}
                  <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <h4 style={{ margin: "0 0 3px 0", fontSize: "1rem", color: primaryColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {shop.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
                      {/* Only display the category name, without prefix */}
                      {shop.category || 'General Store'} 
                    </p>
                  </div>
                  
                </div>
              ))
          )}
        </div>

        {/* Right Panel: Leaflet Map (65% width) */}
        <div style={{ width: "65%", height: "100%", marginLeft: "20px", borderRadius: "12px", overflow: 'hidden' }}>
          <MapContainer
            key={referenceLocation.toString()} 
            center={referenceLocation}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Current Reference Marker (Saved or Live) */}
            <Marker 
                position={referenceLocation} 
                icon={useLiveLocation ? liveIcon : deliveryIcon}
            >
              <Popup>
                  {useLiveLocation ? "🟢 You are here (Live)" : "🏠 Your Saved Delivery Location"}
              </Popup>
            </Marker>

            {/* Search Radius Circle */}
            <Circle
              center={referenceLocation}
              radius={searchRadius * 1000}
              color="#144139"
              fillColor="#C8A46B"
              fillOpacity={0.25}
            />

            {/* Shop Markers */}
            {shops.map((shop) => (
              <Marker
                key={shop._id}
                position={[
                  shop.location.coordinates[1],
                  shop.location.coordinates[0],
                ]}
                icon={shopIcon}
              >
                <Popup>
                  <b>{shop.name}</b> <br />
                  {shop.category || 'General Store'} <br />
                  📍 {shop.address}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      
      {/* Footer Placeholder (Outside the flex container) */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '12px', 
        textAlign: 'center',
        color: '#777',
        margin: '20px 20px 30px 20px'
      }}>
        <p style={{ margin: 0 }}>Order Tracking and Personalized Recommendations would be displayed in other modules.</p>
      </div>
    </div>
  );
}