import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddProduct() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('Unauthorized: Please log in first.');
        setLoading(false);
        return;
      }

      const productData = {
        name,
        description,
        price,
        stock,
      };

      const res = await fetch(
        'https://asia-south1-aroundu-473113.cloudfunctions.net/add_product',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.msg || 'Failed to add product');
      }

      setMsg(`✅ Product "${responseData.newProduct.name}" added successfully!`);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/shopkeeper-dashboard');
      }, 1500);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        minHeight: '100vh',
        padding: 30,
        color: '#144139',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <h2 style={{ fontSize: '1.8rem', marginBottom: 20 }}>Add a New Product</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 500,
          margin: '0 auto',
          gap: 16,
        }}
      >
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          style={{ ...inputStyle, resize: 'none' }}
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
          style={inputStyle}
        />

        {msg && (
          <p
            style={{
              color: msg.includes('successfully') ? 'green' : 'red',
              textAlign: 'center',
            }}
          >
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#C8A46B',
            color: '#144139',
            border: 'none',
            borderRadius: 10,
            padding: '14px',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.3s ease',
          }}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  fontSize: '1rem',
  borderRadius: 10,
  border: '1px solid #ddd',
  width: '100%',
};
