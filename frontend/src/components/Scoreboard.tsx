import type { SessionTeam } from "../types/api";

interface ScoreboardProps {
  teams: SessionTeam[];
  activeTeamId?: string | null;
  onSelectTeam?: (teamId: string) => void;
}

const Scoreboard = ({ teams, activeTeamId, onSelectTeam }: ScoreboardProps) => {
  if (!teams.length) return null;
  return (
    <div className="scoreboard">
      {teams.map((team) => {
        const isActive = activeTeamId === team.id;
        return (
          <button
            key={team.id}
            type="button"
            className={`score-card${isActive ? " active" : ""}`}
            style={{ cursor: onSelectTeam ? "pointer" : "default" }}
            onClick={() => onSelectTeam?.(team.id)}
          >
            <div style={{ fontSize: "0.9rem", textTransform: "uppercase", color: "#94a3b8" }}>
              Team
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>{team.name}</div>
            <div style={{ marginTop: "0.75rem", fontSize: "2rem", fontWeight: 800 }}>
              {team.score}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Scoreboard;
