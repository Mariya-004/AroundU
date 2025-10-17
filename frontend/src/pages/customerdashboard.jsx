import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Define the API endpoint
const SEARCH_API_ENDPOINT = "https://asia-south1-aroundu-473113.cloudfunctions.net/search_item";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user?.name || "Guest";

  // State for the search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // CORRECTED: Function to call the search API using GET method
  const handleSearch = async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // CORRECTED: Construct URL with query parameter for a GET request
      const url = `${SEARCH_API_ENDPOINT}?query=${encodeURIComponent(query)}`;

      // CORRECTED: Use GET method and remove body/headers for Content-Type
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // CORRECTED: The results are inside the 'results' property of the response
      setSearchResults(data.results || []); 

    } catch (error) {
      console.error("Search API Error:", error);
      setSearchError("Failed to fetch search results. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce the search input to limit API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);


  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "30px 20px",
        fontFamily: "'Poppins', sans-serif",
        color: "#144139",
      }}
    >
      {/* Greeting */}
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Hi {userName} 👋</h2>

      {/* Profile and Map Buttons */}
      <button
        style={{ marginBottom: "20px", padding: "10px 20px", background: "#C8A46B", color: "#144139", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginRight: "10px" }}
        onClick={() => navigate("/customer-profile")}
      >
        Profile Setup
      </button>
      <button
        style={{ marginBottom: "20px", padding: "10px 20px", background: "#144139", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        onClick={() => navigate("/customer-map")}
      >
        View Map
      </button>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "12px 16px", fontSize: "1rem", borderRadius: "10px", border: "1px solid #ccc", marginBottom: "15px" }}
      />

      {/* CORRECTED: Search Results Display Area */}
      {searchQuery.length > 0 && (
        <div style={{ marginBottom: "30px", padding: "10px", border: "1px solid #eee", borderRadius: "8px", background: "#f9f9f9" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "10px", color: "#007bff" }}>Search Results for "{searchQuery}"</h3>
          
          {isSearching && <p style={{ color: "#555" }}>Searching...</p>}
          
          {searchError && <p style={{ color: "red", fontWeight: "bold" }}>{searchError}</p>}
          
          {!isSearching && !searchError && searchResults.length === 0 && (
            <p style={{ color: "#777" }}>No items found.</p>
          )}

          {!isSearching && searchResults.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {searchResults.map((result, index) => (
                // CORRECTED: Displaying product and shop name from the API response
                <li key={index} style={{ padding: "8px 0", borderBottom: "1px dotted #ddd" }}>
                  <strong>{result.product.name}</strong> - <span style={{color: "#555"}}>from {result.shopName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* --- Rest of the dashboard content restored below --- */}

      {/* Explore Nearby Section */}
      <div
        style={{
          background: "#f0f0f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Explore Nearby</h3>
        <p style={{ fontSize: "0.95rem", color: "#555" }}>
          Discover shops and services around your location.
        </p>
        <button
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            background: "#144139",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => navigate("/customer-map")}
        >
          Explore Now
        </button>
      </div>

      {/* Order Tracking */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Track Your Order</h3>
        <div
          style={{
            background: "#f9f9f9",
            padding: "15px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0 }}>Order #21354</p>
            <p style={{ margin: 0 }}>The Corner Store</p>
            <p style={{ margin: 0 }}>Est. delivery: 20 min</p>
          </div>
          <span style={{ fontSize: "2rem" }}>🛵</span>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Recommended For You</h3>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          {["Groceries", "Electronics", "Clothing", "Pharmacy"].map((category) => (
            <div
              key={category}
              style={{
                flex: "1 1 45%",
                background: "#f0f0f0",
                padding: "20px",
                borderRadius: "10px",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Recent Orders</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "10px" }}>
            <strong>The Corner Store</strong> — Order #21354 —{" "}
            <span style={{ color: "green" }}>Delivered</span>
          </li>
          <li>
            <strong>The Tech Shop</strong> — Order #21353 —{" "}
            <span style={{ color: "green" }}>Delivered</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

