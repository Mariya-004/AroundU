import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GET_CART_API = "https://asia-south1-aroundu-473113.cloudfunctions.net/get_cart";

const primaryColor = "#144139";
const secondaryColor = "#C8A46B";
const neutralBg = "#f9f9f9";
const whiteBg = "#fff";
const borderColor = "#e0e0e0";
const dangerColor = "#dc3545";

export default function CustomerCartPage() {
  const navigate = useNavigate();

  const [cartData, setCartData] = useState(null);
  const [totals, setTotals] = useState({ totalItems: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // --- Fetch Cart ---
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        if (!token) throw new Error("You are not logged in.");

        const res = await fetch(GET_CART_API, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || `Error: ${res.status}`);
        }

        const data = await res.json();
        setCartData(data.cart);
        setTotals(data.totals);
      } catch (err) {
        console.error("Fetch cart failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [token]);

  // --- Navigation handlers ---
  const handleBackToShops = () => navigate("/customer-dashboard");
  const handleCheckout = () => alert("Checkout feature coming soon!");

  // --- UI States ---
  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h2 style={{ color: primaryColor }}>Loading your cart...</h2>
      </div>
    );

  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: "20%", color: dangerColor }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  if (!cartData || !cartData.products?.length)
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "15%",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <h2 style={{ color: primaryColor }}>🛒 Your cart is empty</h2>
        <p style={{ color: "#666" }}>
          Browse nearby shops and add products to your cart.
        </p>
        <button
          onClick={handleBackToShops}
          style={{
            marginTop: "20px",
            padding: "10px 18px",
            background: primaryColor,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Back to Shops
        </button>
      </div>
    );

  // --- Render Cart ---
  return (
    <div
      style={{
        background: neutralBg,
        minHeight: "100vh",
        fontFamily: "'Poppins', sans-serif",
        color: primaryColor,
        padding: "30px",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>🛒 Your Cart</h1>

      <div
        style={{
          background: whiteBg,
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "20px",
          marginBottom: "30px",
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Shop Info */}
        <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
          {cartData.shopId?.name || "Shop"}{" "}
          <span style={{ color: "#666", fontSize: "0.9rem" }}>
            {cartData.shopId?.address}
          </span>
        </h3>

        {/* Product List */}
        <div>
          {cartData.products.map((p) => (
            <div
              key={p.productId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    background: "#eee",
                  }}
                />
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{p.name}</h4>
                  <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                    ₹{p.price} × {p.quantity}
                  </p>
                </div>
              </div>

              <div style={{ fontWeight: "bold", color: secondaryColor }}>
                ₹{(p.price * p.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.1rem",
            fontWeight: "bold",
          }}
        >
          <span>Total ({totals.totalItems} items)</span>
          <span style={{ color: secondaryColor }}>₹{totals.subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={handleBackToShops}
          style={{
            padding: "10px 18px",
            background: primaryColor,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Continue Shopping
        </button>

        <button
          onClick={handleCheckout}
          style={{
            padding: "10px 18px",
            background: secondaryColor,
            color: primaryColor,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
}
