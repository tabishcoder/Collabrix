import { useState } from "react";
import axios from "axios";

function App() {
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [inbox, setInbox] = useState([]);

    const sendEmail = async () => {
        try {
            const res = await axios.post("http://localhost:5000/api/send", {
                to,
                subject,
                message,
            });
            alert(res.data.message);
            setTo("");
            setSubject("");
            setMessage("");
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    const loadInbox = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/inbox");
            setInbox(res.data);
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    const styles = {
        app: {
            fontFamily: "Segoe UI, sans-serif",
            backgroundColor: "#f7f9fc",
            minHeight: "100vh",
            padding: "40px 20px",
            color: "#333",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        },
        container: {
            width: "100%",
            maxWidth: "800px",
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        },
        header: {
            textAlign: "center",
            marginBottom: "30px",
        },
        title: {
            fontSize: "28px",
            fontWeight: "bold",
            color: "#2f80ed",
        },
        subtext: {
            fontSize: "14px",
            color: "#555",
            marginTop: "4px",
        },
        section: {
            marginBottom: "30px",
        },
        label: {
            fontSize: "15px",
            fontWeight: 500,
            display: "block",
            marginBottom: "5px",
        },
        input: {
            width: "100%",
            padding: "10px 12px",
            marginBottom: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px",
        },
        textarea: {
            width: "100%",
            height: "120px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px",
            resize: "none",
        },
        button: {
            backgroundColor: "#2f80ed",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            fontSize: "15px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "0.3s",
            marginTop: "10px",
        },
        buttonHover: {
            backgroundColor: "#1c60c7",
        },
        inboxContainer: {
            marginTop: "10px",
            backgroundColor: "#fafafa",
            borderRadius: "10px",
            padding: "15px",
            border: "1px solid #e0e0e0",
            maxHeight: "800px",
            overflowY: "auto",
        },
        emailCard: {
            backgroundColor: "#fff",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
        emailSubject: {
            fontSize: "16px",
            fontWeight: "bold",
            color: "#2f80ed",
        },
        emailFrom: {
            fontSize: "14px",
            color: "#555",
            marginBottom: "4px",
        },
        emailSnippet: {
            fontSize: "14px",
            color: "#666",
        },
    };

    return (
        <div style={styles.app}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>📧 Gmail MERN App (No Login)</h2>
                    <p style={styles.subtext}>
                        Send and Read Emails Directly from your Gmail API — Powered by Node
                        + React
                    </p>
                </div>

                {/* Send Email Section */}
                <div style={styles.section}>
                    <h3>✉️ Send Email</h3>

                    <label style={styles.label}>To:</label>
                    <input
                        style={styles.input}
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="example@gmail.com"
                    />

                    <label style={styles.label}>Subject:</label>
                    <input
                        style={styles.input}
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject"
                    />

                    <label style={styles.label}>Message:</label>
                    <textarea
                        style={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your message here..."
                    />

                    <button
                        style={styles.button}
                        onMouseOver={(e) =>
                        (e.target.style.backgroundColor =
                            styles.buttonHover.backgroundColor)
                        }
                        onMouseOut={(e) =>
                            (e.target.style.backgroundColor = styles.button.backgroundColor)
                        }
                        onClick={sendEmail}
                    >
                        Send Email
                    </button>
                </div>

                <hr
                    style={{
                        border: "none",
                        borderTop: "1px solid #ddd",
                        margin: "20px 0",
                    }}
                />

                {/* Inbox Section */}
                <div style={styles.section}>
                    <h3>📥 Inbox</h3>
                    <button
                        style={styles.button}
                        onMouseOver={(e) =>
                        (e.target.style.backgroundColor =
                            styles.buttonHover.backgroundColor)
                        }
                        onMouseOut={(e) =>
                            (e.target.style.backgroundColor = styles.button.backgroundColor)
                        }
                        onClick={loadInbox}
                    >
                        Load Inbox
                    </button>

                    <div style={styles.inboxContainer}>
                        {inbox.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#888" }}>
                                No emails loaded yet.
                            </p>
                        ) : (
                            inbox.map((mail) => (
                                <div key={mail.id} style={styles.emailCard}>
                                    <div style={styles.emailFrom}>From: {mail.from}</div>
                                    <div style={styles.emailSubject}>Subject: {mail.subject}</div>
                                    <div style={styles.emailSnippet}>{mail.snippet}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
