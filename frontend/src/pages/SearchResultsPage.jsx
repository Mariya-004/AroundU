import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// --- Styles & Constants (Define locally for a self-contained page) ---
const primaryColor = "#144139"; // Dark green
const secondaryColor = "#C8A46B"; // Gold/brown
const whiteBg = "#fff";
const neutralBg = "#f9f9f9";
const borderColor = "#e0e0e0";
const dangerColor = "#dc3545"; // Red for errors

const SEARCH_API_ENDPOINT = "https://asia-south1-aroundu-473113.cloudfunctions.net/search_item";

const productItemStyle = {
  background: whiteBg,
  borderRadius: "12px",
  padding: "15px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  marginBottom: "15px",
  display: "flex",
  gap: "20px",
  alignItems: "center",
  border: `1px solid ${borderColor}`,
};

const imagePlaceholderStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "8px",
  background: neutralBg,
  flexShrink: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: primaryColor,
  fontSize: '0.9rem',
  fontWeight: '600',
};

const addToCartBtnStyle = {
  padding: "8px 15px",
  background: secondaryColor,
  color: primaryColor,
  border: `1px solid ${primaryColor}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.2s",
};

// --- Component Definition ---
export default function SearchResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract the query from the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('query');
    setSearchQuery(query || '');

    if (query) {
      fetchSearchResults(query);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  // Function to fetch the results
  const fetchSearchResults = async (query) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const url = `${SEARCH_API_ENDPOINT}?query=${encodeURIComponent(query)}`;
      const token = localStorage.getItem("token");
      
      const response = await fetch(url, { 
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);

    } catch (err) {
      console.error("Search API Error:", err);
      setError("Failed to fetch search results. Please check your connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Add to Cart (Conceptual)
  const handleAddToCart = (productId, shopId) => {
    console.log(`Adding Product ${productId} from Shop ${shopId} to cart.`);
    // In a real app, this would dispatch a Redux action or call an API endpoint.
    alert(`Added product to cart!`);
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
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '20px', padding: '8px 15px', background: primaryColor, color: whiteBg, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
        Search Results for "{searchQuery}"
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Found {results.length} item(s) in nearby shops.
      </p>

      {/* --- Loading and Error States --- */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#555' }}>
          Searching for products...
        </div>
      )}
      
      {error && (
        <div style={{ padding: '20px', background: '#ffebeb', border: `1px solid ${dangerColor}`, borderRadius: '8px', color: dangerColor }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Error:</p>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div style={{ padding: '50px', textAlign: 'center', color: '#777' }}>
          No products matching "{searchQuery}" were found in your area.
        </div>
      )}

      {/* --- Product List --- */}
      {!loading && results.length > 0 && (
        <div>
          {results.map((result) => (
            // Note: The API response structure seems to be { product: {...}, shopName: '...', shopId: '...' }
            <div key={result.product.id || result.product._id} style={productItemStyle}>
              
              {/* Product Image Placeholder */}
              <div style={imagePlaceholderStyle}>
                Item
              </div>

              {/* Product Details */}
              <div style={{ flexGrow: 1 }}>
                <h2 style={{ margin: "0 0 5px 0", fontSize: "1.2rem", color: primaryColor }}>
                  {result.product.name}
                </h2>
                <p style={{ margin: "0 0 5px 0", fontSize: "1rem", color: secondaryColor, fontWeight: 'bold' }}>
                  ₹ {result.product.price ? result.product.price.toFixed(2) : 'N/A'}
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                  Sold by: <strong>{result.shopName}</strong>
                </p>
                <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#888" }}>
                  Category: {result.product.category || 'N/A'} | Stock: {result.product.stock || 'High'}
                </p>
              </div>

              {/* Actions */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <button
                  style={addToCartBtnStyle}
                  onClick={() => handleAddToCart(result.product.id || result.product._id, result.shopId)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}