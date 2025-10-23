import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProduct() {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
  });
  const [message, setMessage] = useState("");

  // ✅ Fetch existing product details (from shop_products API)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const found = data.products?.find((p) => p._id === productId);
        if (found) setProduct(found);
        else setMessage("Product not found.");
      } catch (err) {
        setMessage("Error fetching product details.");
      }
    };
    fetchProduct();
  }, [productId]);

  // ✅ Handle changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/edit_products/shops/${shopId}/products/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(product),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Failed to update product");
      } else {
        setMessage("✅ Product updated successfully!");
        setTimeout(() => navigate("/shop-products"), 1500);
      }
    } catch (err) {
      setMessage("❌ Server error while updating product.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Edit Product</h2>
      {message && <p style={styles.message}>{message}</p>}

      <form onSubmit={handleUpdate} style={styles.form}>
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Product Name"
          required
          style={styles.input}
        />
        <textarea
          name="description"
          value={product.description}
          onChange={handleChange}
          placeholder="Description"
          rows="3"
          style={styles.input}
        />
        <input
          type="number"
          name="price"
          value={product.price}
          onChange={handleChange}
          placeholder="Price"
          required
          style={styles.input}
        />
        <input
          type="number"
          name="stock"
          value={product.stock}
          onChange={handleChange}
          placeholder="Stock"
          required
          style={styles.input}
        />
        <input
          type="text"
          name="imageUrl"
          value={product.imageUrl || ""}
          onChange={handleChange}
          placeholder="Image URL"
          style={styles.input}
        />

        <button type="submit" style={styles.btn}>
          💾 Update Product
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    maxWidth: "600px",
    margin: "50px auto",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontFamily: "Poppins, sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#144139",
    marginBottom: "20px",
  },
  message: {
    textAlign: "center",
    color: "green",
    marginBottom: "10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  btn: {
    padding: "12px",
    background: "#C8A46B",
    color: "#144139",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
