import React, { useState } from "react";
import axios from "axios";
import ZoomMtgEmbedded from "@zoomus/websdk/embedded";

// Create the embedded Zoom client
const client = ZoomMtgEmbedded.createClient();

const sdkKey = "XEZY1MjzQlixjDwRkoBZnA"; // Your Zoom Client ID (SDK Key)

function App() {
  const [meetingNumber, setMeetingNumber] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  // ✅ Join Meeting
  const joinMeeting = async () => {
    try {
      // Get meeting signature from backend
      const res = await axios.get(
        `http://localhost:5000/signature?meetingNumber=${meetingNumber}&role=0`
      );
      const signature = res.data.signature;

      // DOM element where Zoom renders UI
      const meetingSDKElement = document.getElementById("zmmtg-root");

      // Initialize client
      await client.init({
        zoomAppRoot: meetingSDKElement,
        language: "en-US",
        customize: {
          video: {
            isResizable: true,
            viewSizes: {
              default: { width: 800, height: 600 },
              ribbon: { width: 400, height: 600 },
            },
          },
        },
      });

      // Join the meeting
      await client.join({
        sdkKey,
        signature,
        meetingNumber,
        password: "", // add passcode if required
        userName: "Tabish",
      });

      console.log("✅ Successfully joined meeting");
    } catch (err) {
      console.error("❌ Join error:", err);
    }
  };

  // ✅ Create Meeting (calls backend)
  const createMeeting = async () => {
    try {
      const res = await axios.post("http://localhost:5000/create-meeting", {
        topic: "My MERN Meeting",
      });
      setMeetingLink(res.data.join_url);
    } catch (err) {
      console.error("❌ Create error:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚀 Zoom MERN App (Embedded SDK)</h1>

      {/* <input
        type="text"
        placeholder="Enter Meeting ID"
        value={meetingNumber}
        onChange={(e) => setMeetingNumber(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <button onClick={joinMeeting}>Join Meeting</button>

      <hr /> */}

      <button onClick={createMeeting}>Create Instant Meeting</button>
      {meetingLink && (
        <p>
          Meeting created:{" "}
          <a href={meetingLink} target="_blank" rel="noreferrer">
            {meetingLink}
          </a>
        </p>
      )}

      {/* 👇 Zoom SDK renders the meeting here */}
      <div id="zmmtg-root" style={{ width: "100%", height: "600px" }}></div>
    </div>
  );
}

export default App;
