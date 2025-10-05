import { useState } from "react";

function App() {
  const [output, setOutput] = useState(null);

  const loadBoard = () => {
    fetch("http://localhost:5000/api/board")
      .then((res) => res.json())
      .then((data) => setOutput(data));
  };

  const loadLists = () => {
    fetch("http://localhost:5000/api/board/lists")
      .then((res) => res.json())
      .then((data) => setOutput(data));
  };

  const loadCards = () => {
    fetch("http://localhost:5000/api/board/cards")
      .then((res) => res.json())
      .then((data) => setOutput(data));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Trello API Demo</h1>

      <button onClick={loadBoard} style={btnStyle}>Load Board Info</button>
      <button onClick={loadLists} style={btnStyle}>Load Lists</button>
      <button onClick={loadCards} style={btnStyle}>Load Cards</button>

      <pre style={outputStyle}>
        {output ? JSON.stringify(output, null, 2) : "Click a button to load data"}
      </pre>
    </div>
  );
}

const btnStyle = {
  marginRight: "10px",
  padding: "10px 15px",
  cursor: "pointer",
};

const outputStyle = {
  marginTop: "20px",
  background: "#f4f4f4",
  padding: "15px",
  borderRadius: "5px",
  maxHeight: "400px",
  overflowY: "scroll",
};

export default App;
