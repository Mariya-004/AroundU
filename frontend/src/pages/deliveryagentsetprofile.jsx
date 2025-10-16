import React, { useState, useEffect } from "react";

// This is a self-contained component. For a real app, styles and icons would be in separate files.
// Dynamic styles are injected into the document's head.

export default function DeliveryAgentProfileSetup() {
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        vehicleType: "Bike",
        currentLocation: "",
    });

    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Fetch existing profile data on component mount
    useEffect(() => {
        const fetchProfile = async () => {
            setIsFetching(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setMessage({ text: "You need to be logged in.", type: "error" });
                    return;
                }

                const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent-profile", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        fullName: data.name || "",
                        phoneNumber: data.phoneNumber || "",
                        vehicleType: data.vehicleType || "Bike",
                        currentLocation: "", // Clear location to avoid showing raw coordinates
                    });
                } else if (res.status !== 404) {
                    const data = await res.json();
                    setMessage({ text: data.msg || "Failed to fetch profile.", type: "error" });
                }
            } catch (err) {
                setMessage({ text: "Server error while fetching profile.", type: "error" });
            } finally {
                setIsFetching(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent-profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ text: data.msg || "Failed to update profile", type: "error" });
            } else {
                setMessage({ text: data.msg, type: "success" });
            }
        } catch (err) {
            setMessage({ text: "A server error occurred. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div style={styles.container}>
                <div style={styles.loader}></div>
                <p style={{color: '#144139', marginTop: '10px'}}>Loading Profile...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Delivery Agent Profile</h2>
                <p style={styles.subtitle}>Keep your information up to date.</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <span style={styles.icon}>{UserIcon}</span>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            className="input-focus"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <span style={styles.icon}>{PhoneIcon}</span>
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="Phone Number"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            className="input-focus"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <span style={styles.icon}>{VehicleIcon}</span>
                        <select
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleChange}
                            required
                            style={{ ...styles.input, appearance: 'none' }}
                            className="input-focus"
                        >
                            <option value="Bike">Bike</option>
                            <option value="Scooter">Scooter</option>
                            <option value="Car">Car</option>
                            <option value="Van">Van</option>
                        </select>
                    </div>
                    <div style={styles.inputGroup}>
                        <span style={styles.icon}>{LocationIcon}</span>
                        <input
                            type="text"
                            name="currentLocation"
                            placeholder="Current Area (e.g., Sakthan Thampuran Nagar)"
                            value={formData.currentLocation}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            className="input-focus"
                        />
                    </div>

                    {message.text && (
                        <p style={{
                            ...styles.message,
                            color: message.type === "success" ? "#28a745" : "#dc3545",
                            background: message.type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                        }}>
                            {message.text}
                        </p>
                    )}

                    <button type="submit" style={isLoading ? {...styles.submitBtn, ...styles.submitBtnDisabled} : styles.submitBtn} disabled={isLoading} className="submit-btn-hover">
                        {isLoading ? "Saving..." : "Save Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- ICONS & STYLES ---
// (Best practice would be to move these to separate files)

const UserIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PhoneIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const VehicleIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8.28a1.5 1.5 0 0 0-1.04-1.43l-4.2-1.4a1.5 1.5 0 0 0-1.92 1.57l1 6.06A1.5 1.5 0 0 0 9.4 14.5H12v2"></path><circle cx="6.5" cy="16.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>;
const LocationIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

const styles = {
    container: {
        background: "#f0f2f5", minHeight: "100vh", display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Poppins', sans-serif",
    },
    card: {
        background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "500px", textAlign: "center",
    },
    title: {
        fontSize: "2rem", color: "#144139", fontWeight: 600, marginBottom: "10px",
    },
    subtitle: {
        fontSize: "1rem", color: "#555", marginBottom: "30px",
    },
    form: {
        display: "flex", flexDirection: "column", gap: "20px",
    },
    inputGroup: {
        position: "relative",
    },
    icon: {
        position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999",
    },
    input: {
        width: "100%", padding: "14px 14px 14px 50px", fontSize: "1rem", borderRadius: "10px", border: "1px solid #ddd", background: "#f9f9f9", boxSizing: "border-box", color: '#333'
    },
    submitBtn: {
        padding: "16px", fontSize: "1.1rem", borderRadius: "10px", background: "#C8A46B", color: "#144139", fontWeight: "bold", cursor: "pointer", border: "none", marginTop: "10px", transition: "background-color 0.3s, transform 0.2s",
    },
    submitBtnDisabled: {
        backgroundColor: '#ccc', cursor: 'not-allowed', transform: 'none'
    },
    message: {
        padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 500,
    },
    loader: {
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #C8A46B',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite'
    }
};

// Inject dynamic CSS for focus/hover effects and loader animation
const dynamicCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
  
  .input-focus:focus {
    outline: none;
    border-color: #C8A46B;
    box-shadow: 0 0 0 3px rgba(200, 164, 107, 0.3);
  }
  .submit-btn-hover:hover:not(:disabled) {
      background-color: #b7905a;
      transform: translateY(-2px);
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

if (!document.getElementById('dynamic-styles-delivery-profile')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'dynamic-styles-delivery-profile';
    styleSheet.innerText = dynamicCSS;
    document.head.appendChild(styleSheet);
}
