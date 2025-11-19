import { motion } from "framer-motion";
import type { SessionTeam } from "../types/api";

interface ScoreboardProps {
  teams: SessionTeam[];
  currentTurnIndex: number;
  isGameOver?: boolean;
  onTeamClick?: (teamIndex: number) => void;
  onSelectTeam?: (teamId: string) => void;
}

const Scoreboard = ({ teams, currentTurnIndex, isGameOver = false, onTeamClick, onSelectTeam }: ScoreboardProps) => {
  if (!teams.length) return null;
  return (
    <div className="scoreboard">
      {teams.map((team, index) => {
        const isActive = !isGameOver && index === currentTurnIndex;
        return (
          <motion.button
            key={team.id}
            type="button"
            className={`score-card${isActive ? " active" : ""}`}
            animate={{ scale: isActive ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              cursor: onTeamClick && !isGameOver ? "pointer" : "default",
              // transition: "all 0.2s ease", // Handled by framer-motion
            }}
            onClick={() => {
              if (onTeamClick && !isGameOver) onTeamClick(index);
              if (onSelectTeam) onSelectTeam(team.id);
            }}
            onMouseEnter={(e) => {
              if (onTeamClick && !isGameOver && !isActive) {
                e.currentTarget.style.backgroundColor = "#f8fafc";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#fff";
              }
            }}
          >
            <div style={{ fontSize: "0.9rem", textTransform: "uppercase", color: "#94a3b8" }}>
              Team
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>{team.name}</div>
            <div style={{ marginTop: "0.75rem", fontSize: "2rem", fontWeight: 800 }}>
              {team.score}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default Scoreboard;
