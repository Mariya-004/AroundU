import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import

export default function AddProduct() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate(); // Add this line

  // Example image upload handler (replace with your actual upload logic)
  const handleImageUpload = async (file) => {
    // You can use a cloud service like Cloudinary, Firebase Storage, or your own backend
    // Here is a placeholder for demonstration
    const formData = new FormData();
    formData.append('file', file);

    // Replace with your actual image upload endpoint
    const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/add_product', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.url; // The URL of the uploaded image
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    let uploadedImageUrl = imageUrl;
    if (imageFile) {
      uploadedImageUrl = await handleImageUpload(imageFile);
      setImageUrl(uploadedImageUrl);
    }

    const token = localStorage.getItem('token');
    const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/add-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        name,
        description,
        price,
        stock,
        imageUrl: uploadedImageUrl
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.msg || 'Error adding product');
    } else {
      setMsg('Product added successfully!');
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImageFile(null);
      setImageUrl('');
      setTimeout(() => {
        navigate('/shopkeeper-dashboard'); // Navigate after success
      }, 1200);
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 420,
      margin: '40px auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      padding: 32
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Add Product</h2>
      <button
        type="button"
        onClick={() => navigate('/shopkeeper-dashboard')}
        style={{
          marginBottom: 16,
          background: '#eee',
          color: '#222',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        ← Back to Dashboard
      </button>
      <form onSubmit={handleSubmit}>
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
          style={{ marginBottom: 16, width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e4e4e4' }}
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
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0])}
          style={{ marginBottom: 16 }}
        />
        {imageUrl && (
          <img src={imageUrl} alt="Product" style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
        )}
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
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
        {msg && <div style={{ marginTop: 16, textAlign: 'center', color: msg.includes('success') ? 'green' : 'red' }}>{msg}</div>}
      </form>
    </div>
  );
}
