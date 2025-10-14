import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddProduct() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    // Basic validation to ensure an image is selected
    if (!imageFile) {
        setMsg('Please select a product image.');
        setLoading(false);
        return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('stock', stock);
      // --- THIS IS THE CORRECTED LINE ---
      formData.append('productImage', imageFile); // The key must match the backend ('productImage')

      const token = localStorage.getItem('token');
      const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/add_product', {
        method: 'POST',
        headers: {
          // Note: Don't set Content-Type, the browser does it automatically for FormData
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await res.json();
      if (!res.ok) {
        // Use the error message from the backend, or a default one
        throw new Error(responseData.msg || 'Failed to add product');
      }

      setMsg(`Product "${responseData.newProduct.name}" added successfully!`);

      // Redirect back to the dashboard after a short delay
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
    <div style={{ background: '#fff', minHeight: '100vh', padding: 30, color: '#144139' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: 20 }}>Add a New Product</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: 500 }}>
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ marginBottom: 16, width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e4e4e4' }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          rows={4}
          style={{ marginBottom: 16, width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e4e4e4', resize: 'none' }}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
          style={{ marginBottom: 16, width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e4e4e4' }}
        />
        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={e => setStock(e.target.value)}
          required
          style={{ marginBottom: 16, width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e4e4e4' }}
        />
        <label style={{ marginBottom: 8, fontWeight: 'bold' }}>Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0])}
          required // Made this required to match backend logic
          style={{ marginBottom: 16 }}
        />
        
        {msg && <p style={{ color: msg.includes('successfully') ? 'green' : 'red' }}>{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#19c37d',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontWeight: 700,
            fontSize: 17,
            width: '100%',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}