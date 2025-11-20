import { useState } from "react";
import { useProfileStore } from "../store/profileStore";

const LandingPage = () => {
  const initializeGame = useProfileStore((state) => state.initializeGame);
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div
      className="container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column", // تغيير بسيط لترتيب العناصر عمودياً
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        position: "relative" // ضروري عشان التوقيع
      }}
    >
      <div className="card" style={{ padding: "3rem 2rem", maxWidth: 560 }}>
        <p style={{ letterSpacing: "0.35em", color: "#94a3b8", marginBottom: "0.5rem" }}>PEACE</p>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>Peace Cake</h1>
        <p style={{ color: "#64748b", margin: "1rem 0 2rem" }}>
          Bring your classroom together with collaborative trivia.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" style={{ minWidth: 160 }} onClick={initializeGame}>
            START GAME
          </button>
          <button className="btn btn-secondary" style={{ minWidth: 160 }} onClick={() => setShowInstructions(true)}>
            RULES / INSTRUCTIONS
          </button>
        </div>
      </div>

      {/* --- التعديل الجديد: الإمضاء --- */}
      <div style={{ 
        marginTop: "3rem", 
        color: "#64748b", 
        fontSize: "0.9rem", 
        fontWeight: 500 
      }}>
        ✨ Vibe Coding by <span style={{ 
          background: "linear-gradient(to right, #8b5cf6, #ec4899)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          fontWeight: "bold"
        }}>Mahmoud Elgindy</span>
      </div>
      {/* ----------------------------- */}

      {showInstructions && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 640, maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Game Rules: Peace Cake Quiz Show</h2>
            <p style={{ color: "#475569", fontWeight: 600 }}>GOAL: Score the highest points by answering questions correctly.</p>

            <ol style={{ paddingLeft: "1.25rem", color: "#475569", lineHeight: 1.5 }}>
              <li style={{ marginBottom: "1rem" }}>
                <strong>Profiles &amp; Setup</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1rem" }}>
                  <li>Start the game by selecting or creating your Instructor Profile.</li>
                  <li>The Host will set up 2 to 4 competing teams.</li>
                </ul>
              </li>
              <li style={{ marginBottom: "1rem" }}>
                <strong>The Board &amp; Points</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1rem" }}>
                  <li>The board is divided into <strong>4 columns</strong>: 10 pts (Easy), 20 pts (Medium), 30 pts (Hard), and <strong>40 pts (Impossible)</strong>.</li>
                  <li>Questions are sequentially numbered within each point category (e.g., 1 - Easy, 2 - Easy, etc.).</li>
                  <li>Teams take turns selecting a category and question number.</li>
                </ul>
              </li>
              <li style={{ marginBottom: "1rem" }}>
                <strong>Answering &amp; Timing</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1rem" }}>
                  <li>The question and timer only begin after the Host clicks "Start &amp; Reveal".</li>
                  <li>The active team has 20 seconds to provide their answer.</li>
                  <li>The Host determines if the answer is correct.</li>
                </ul>
              </li>
              <li style={{ marginBottom: "1rem" }}>
                <strong>The Steal Rule (5 Seconds)</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1rem" }}>
                  <li>If the active team answers incorrectly, the next team in line gets a chance to "Steal" the question.</li>
                  <li>The Steal attempt lasts 5 seconds (displayed in red).</li>
                  <li>A successful steal awards half the points for that question.</li>
                </ul>
              </li>
              <li>
                <strong>Winning</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1rem" }}>
                  <li>The game ends when all questions are used.</li>
                  <li>The team with the highest accumulated score wins!</li>
                  <li>The system displays a final Winner Celebration screen.</li>
                </ul>
              </li>
            </ol>

            <button className="btn btn-primary" onClick={() => setShowInstructions(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;