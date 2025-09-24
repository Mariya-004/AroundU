import React, { useState } from "react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Signup failed");
      } else {
        setSuccess("Signup successful!");
        console.log("Token:", data.token);
        console.log("User:", data.user);
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div
      style={{
        background: "#ffffff", // White background
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        color: "#144139",
        textAlign: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          background: "#f9f9f9",
          padding: "40px",
          borderRadius: "20px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 0 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "10px" }}>
          Create your account
        </h2>
        <p style={{ fontSize: "1rem", marginBottom: "30px", fontWeight: "500" }}>
          Join our hyperlocal marketplace.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              padding: "14px",
              fontSize: "1rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              padding: "14px",
              fontSize: "1rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              padding: "14px",
              fontSize: "1rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />

          <div>
            <p style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "10px" }}>I am a...</p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              {["Customer", "Shopkeeper", "Delivery Agent"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: formData.role === role ? "2px solid #144139" : "1px solid #ccc",
                    background: formData.role === role ? "#C8A46B" : "#ffffff",
                    color: formData.role === role ? "#144139" : "#333",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}
          {success && <p style={{ color: "green", fontSize: "0.9rem" }}>{success}</p>}

          <button
            type="submit"
            style={{
              padding: "14px",
              fontSize: "1.2rem",
              borderRadius: "10px",
              background: "#144139",
              color: "#C8A46B",
              fontWeight: "bold",
              cursor: "pointer",
              border: "2px solid #C8A46B",
              marginTop: "10px",
            }}
          >
            Sign up
          </button>
        </form>

        <div style={{ marginTop: "20px" }}>
          <a href="/login" style={{ color: "#144139", fontWeight: "500", textDecoration: "underline" }}>
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
