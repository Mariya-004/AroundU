import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const primaryColor = "#144139";
const secondaryColor = "#C8A46B";
const neutralBg = "#f9f9f9";
const whiteBg = "#fff";

const API_BASE = "https://asia-south1-aroundu-473113.cloudfunctions.net/get_product";

export default function ShopProductsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // add-to-cart UI state
  const [cartMsg, setCartMsg] = useState('');
  const [addingProductId, setAddingProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/${shopId}/products`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Failed to load products");
        setShop(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [shopId]);

  // Add to cart handler
  const handleAddToCart = async (prod) => {
    setCartMsg('');
    setAddingProductId(prod._id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCartMsg('Please log in to add items to cart.');
        return;
      }

      const postUrl = 'https://asia-south1-aroundu-473113.cloudfunctions.net/add_to_cart';
      const body = {
        shopId,
        productId: prod._id,
        name: prod.name,
        price: prod.price,
        imageUrl: prod.imageUrl || ''
      };

      const res = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCartMsg(data.msg || 'Failed to add product to cart.');
      } else {
        setCartMsg('Product added to cart.');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      setCartMsg('Server error while adding to cart.');
    } finally {
      setAddingProductId(null);
      // auto-clear message after a short delay
      setTimeout(() => setCartMsg(''), 3000);
    }
  };

  if (loading)
    return <div style={{ textAlign: "center", marginTop: "20%" }}>Loading...</div>;

  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: "20%", color: "red" }}>
        {error}
      </div>
    );

  return (
    <div
      style={{
        background: neutralBg,
        minHeight: "100vh",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px 30px",
      }}
    >
      {/* Add-to-cart feedback */}
      {cartMsg && <div style={{ marginBottom: 12, color: cartMsg.toLowerCase().includes('added') ? 'green' : 'red' }}>{cartMsg}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: primaryColor,
              color: "#fff",
              border: "none",
              padding: "10px 15px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              marginRight: 10
            }}
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/cart')}
            style={{
              background: "#19c37d",
              color: "#fff",
              border: "none",
              padding: "10px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "700"
            }}
          >
            🛒 Cart
          </button>
        </div>
      </div>

      <h2 style={{ color: primaryColor, marginTop: "20px" }}>
        {shop.shopName} — Products
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {shop.products.length === 0 ? (
          <p style={{ color: "#777" }}>No products available.</p>
        ) : (
          shop.products.map((prod) => (
            <div
              key={prod._id}
              style={{
                background: whiteBg,
                borderRadius: "12px",
                padding: "15px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
            >
              {/* Product Image */}
              {prod.imageUrl ? (
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    background: "#f0f0f0",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#999",
                    fontWeight: "bold",
                  }}
                >
                  No Image
                </div>
              )}

              {/* Product Info */}
              <h4 style={{ margin: "10px 0 5px 0", color: primaryColor }}>
                {prod.name}
              </h4>
              <p style={{ margin: 0, color: "#777" }}>
                {prod.category || "General"}
              </p>

              {/* Product Description */}
              <p
                style={{
                  marginTop: "8px",
                  color: "#555",
                  fontSize: "0.9rem",
                  minHeight: "40px",
                }}
              >
                {prod.description
                  ? prod.description.length > 60
                    ? prod.description.slice(0, 60) + "..."
                    : prod.description
                  : "No description available."}
              </p>

              {/* Stock Alert */}
              {prod.stock < 5 && (
                <p
                  style={{
                    color: "red",
                    fontWeight: "bold",
                    marginTop: "5px",
                  }}
                >
                  ⚠️ Running out of stock ({prod.stock} left)
                </p>
              )}

              {/* Price */}
              <p
                style={{
                  marginTop: "5px",
                  color: secondaryColor,
                  fontWeight: "bold",
                }}
              >
                ₹ {prod.price}
              </p>

              {/* Add to Cart button */}
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handleAddToCart(prod)}
                  disabled={addingProductId === prod._1d}
                  style={{
                    background: "#19c37d",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontWeight: 700,
                    cursor: addingProductId === prod._id ? "not-allowed" : "pointer",
                  }}
                >
                  {addingProductId === prod._id ? "Adding..." : "Add to Cart"}
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
