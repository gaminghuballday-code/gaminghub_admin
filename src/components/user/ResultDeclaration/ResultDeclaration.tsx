import React, { useState, useMemo, useEffect } from "react";
import { type Tournament, type TournamentRules } from "@services/api";
import { Modal } from "@components/common/Modal";
import { Button } from "@components/common/Button";
import "./ResultDeclaration.scss";

interface ResultDeclarationProps {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onSubmit: (data: ResultDeclarationData) => Promise<void>;
  isSubmitting: boolean;
}

export interface Participant {
  userId?: string;
  teamName?: string;
  playerName?: string;
  players?: string[];
  ign?: string;
  name?: string;
}

export interface MatchResult {
  matchNumber: number;
  screenshot: File | null;
  screenshotPreview?: string;
  participantResults: Record<
    string,
    {
      position: number;
      points: number;
    }
  >;
}

export interface ResultDeclarationData {
  tournamentId: string;
  matches: MatchResult[];
  screenshots: File[];
  finalRankings: Array<{
    rank: number;
    participantId: string;
    participantName: string;
    totalPoints: number;
    matchPoints: number[];
  }>;
}

const ResultDeclaration: React.FC<ResultDeclarationProps> = ({
  isOpen,
  tournament,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState(6);

  // Check if tournament is team-based
  const isTeamBased =
    tournament?.subMode?.toLowerCase() === "squad" ||
    tournament?.subMode?.toLowerCase() === "duo";

  // Extract participants from tournament
  const participants = useMemo(() => {
    if (!tournament?.participants || !Array.isArray(tournament.participants)) {
      return [];
    }

    return tournament.participants
      .map((p: any) => ({
        userId: p.userId || p._id || p.id || "",
        teamName: p.teamName || p.team || "",
        playerName: p.playerName || p.name || p.ign || "",
        players: p.players || [],
        ign: p.ign || p.name || "",
        name: p.name || p.ign || "",
      }))
      .filter((p: Participant) => p.userId);
  }, [tournament]);

  // Parse position points from tournament rules
  const positionPoints = useMemo(() => {
    if (!tournament?.rules) return {};

    const rules =
      typeof tournament.rules === "object" && tournament.rules !== null
        ? (tournament.rules as TournamentRules)
        : null;

    if (rules?.positionPoints && typeof rules.positionPoints === "object") {
      return rules.positionPoints as Record<string | number, number>;
    }

    return {};
  }, [tournament]);

  // Initialize matches when tournament changes
  useEffect(() => {
    if (tournament && isOpen && participants.length > 0) {
      const initialMatches: MatchResult[] = Array.from(
        { length: matchCount },
        (_, i) => ({
          matchNumber: i + 1,
          screenshot: null,
          participantResults: {},
        })
      );

      // Initialize participant results for all matches
      participants.forEach((participant) => {
        const participantId = participant.userId || "";
        initialMatches.forEach((match) => {
          match.participantResults[participantId] = {
            position: 0,
            points: 0,
          };
        });
      });

      setMatches(initialMatches);
      setError(null);
    }
  }, [tournament, isOpen, participants, matchCount]);

  const handleMatchCountChange = (count: number) => {
    if (count < 1 || count > 20) return;
    setMatchCount(count);
  };

  const handleScreenshotChange = (matchIndex: number, file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setMatches((prev) => {
        const updated = [...prev];
        updated[matchIndex] = {
          ...updated[matchIndex],
          screenshot: file,
          screenshotPreview: reader.result as string,
        };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePositionChange = (
    matchIndex: number,
    participantId: string,
    position: number
  ) => {
    const points = positionPoints[position] || 0;

    setMatches((prev) => {
      const updated = [...prev];
      const match = updated[matchIndex];
      match.participantResults[participantId] = {
        position,
        points,
      };
      return updated;
    });
  };

  // Calculate final rankings
  const finalRankings = useMemo(() => {
    if (!participants.length || !matches.length) return [];

    const participantTotals: Record<
      string,
      {
        participantId: string;
        participantName: string;
        totalPoints: number;
        matchPoints: number[];
      }
    > = {};

    participants.forEach((participant) => {
      const participantId = participant.userId || "";
      const participantName = isTeamBased
        ? participant.teamName ||
          `Team ${participant.playerName || participant.ign || "Unknown"}`
        : participant.playerName ||
          participant.ign ||
          participant.name ||
          "Unknown";

      let totalPoints = 0;
      const matchPoints: number[] = [];

      matches.forEach((match) => {
        const result = match.participantResults[participantId];
        const points = result?.points || 0;
        totalPoints += points;
        matchPoints.push(points);
      });

      participantTotals[participantId] = {
        participantId,
        participantName,
        totalPoints,
        matchPoints,
      };
    });

    // Sort by total points (descending) and assign ranks
    return Object.values(participantTotals)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [participants, matches, isTeamBased]);

  const getParticipantName = (participant: Participant): string => {
    if (isTeamBased) {
      return (
        participant.teamName ||
        `Team ${participant.playerName || participant.ign || "Unknown"}`
      );
    }
    return (
      participant.playerName || participant.ign || participant.name || "Unknown"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tournament) return;

    // Validate all matches have screenshots
    const missingScreenshots = matches.some((match) => !match.screenshot);
    if (missingScreenshots) {
      setError("Please upload screenshots for all matches");
      return;
    }

    // Validate all participants have positions for all matches
    const missingPositions = matches.some((match) => {
      return participants.some((participant) => {
        const participantId = participant.userId || "";
        const result = match.participantResults[participantId];
        return !result || result.position === 0;
      });
    });

    if (missingPositions) {
      setError("Please enter position for all participants in all matches");
      return;
    }

    const tournamentId = tournament._id || tournament.id || "";
    if (!tournamentId) {
      setError("Invalid tournament ID");
      return;
    }

    const screenshots = matches
      .map((match) => match.screenshot)
      .filter((file): file is File => file !== null);

    try {
      await onSubmit({
        tournamentId,
        matches,
        screenshots,
        finalRankings,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to submit results");
    }
  };

  if (!tournament) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="modal-extra-large"
      title="Declare Tournament Results"
      showCloseButton={true}
      closeOnOverlayClick={!isSubmitting}
    >
      <form className="result-declaration-form" onSubmit={handleSubmit}>
        <div className="result-declaration-body">
          <div className="result-declaration-info">
            <div className="info-row">
              <p>
                <strong>Tournament:</strong> {tournament.game} -{" "}
                {tournament.mode} {tournament.subMode}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {tournament.date
                  ? new Date(tournament.date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="info-row">
              <p>
                <strong>Total {isTeamBased ? "Teams" : "Players"}:</strong>{" "}
                {participants.length}
              </p>
              <div className="match-count-control">
                <label>Number of Matches:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={matchCount}
                  onChange={(e) =>
                    handleMatchCountChange(parseInt(e.target.value) || 6)
                  }
                  disabled={isSubmitting}
                  className="match-count-input"
                />
              </div>
            </div>
          </div>

          {Object.keys(positionPoints).length > 0 && (
            <div className="position-points-reference">
              <h4>Position Points Reference</h4>
              <div className="position-points-grid">
                {Object.entries(positionPoints)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([position, points]) => (
                    <div key={position} className="position-point-item">
                      <span className="position-label">
                        Position {position}:
                      </span>
                      <span className="points-value">{points} points</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="matches-container">
            {matches.map((match, matchIndex) => (
              <div key={matchIndex} className="match-section">
                <div className="match-header">
                  <h4 className="match-title">Match {match.matchNumber}</h4>

                  <div className="screenshot-upload">
                    <label className="upload-label">Screenshot</label>
                    <div className="upload-container">
                      {match.screenshotPreview ? (
                        <div className="screenshot-preview">
                          <img
                            src={match.screenshotPreview}
                            alt={`Match ${match.matchNumber} screenshot`}
                          />
                          <button
                            type="button"
                            className="remove-screenshot"
                            onClick={() => {
                              setMatches((prev) => {
                                const updated = [...prev];
                                updated[matchIndex] = {
                                  ...updated[matchIndex],
                                  screenshot: null,
                                  screenshotPreview: undefined,
                                };
                                return updated;
                              });
                            }}
                            disabled={isSubmitting}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="upload-button">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleScreenshotChange(matchIndex, file);
                            }}
                            disabled={isSubmitting}
                          />
                          <span>📷 Upload Screenshot</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="participants-table-container">
                  <table className="participants-table">
                    <thead>
                      <tr>
                        <th>{isTeamBased ? "Team" : "Player"}</th>
                        <th>Position</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant) => {
                        const participantId = participant.userId || "";
                        const result = match.participantResults[
                          participantId
                        ] || { position: 0, points: 0 };
                        const participantName = getParticipantName(participant);

                        return (
                          <tr key={participantId}>
                            <td className="participant-name-cell">
                              {participantName}
                              {isTeamBased &&
                                participant.players &&
                                participant.players.length > 0 && (
                                  <span className="team-players">
                                    ({participant.players.join(", ")})
                                  </span>
                                )}
                            </td>
                            <td className="position-input-cell">
                              <input
                                type="number"
                                min="1"
                                max={participants.length}
                                value={result.position || ""}
                                onChange={(e) => {
                                  const pos = parseInt(e.target.value) || 0;
                                  handlePositionChange(
                                    matchIndex,
                                    participantId,
                                    pos
                                  );
                                }}
                                placeholder="Enter position"
                                disabled={isSubmitting}
                                className="position-input"
                              />
                            </td>
                            <td className="points-cell">
                              <span className="points-display">
                                {result.points || 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {finalRankings.length > 0 && (
            <div className="final-rankings-section">
              <h4 className="rankings-title">
                🏆 Final Rankings (Auto-Calculated)
              </h4>
              <div className="rankings-container">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>{isTeamBased ? "Team" : "Player"}</th>
                      {matches.map((_, idx) => (
                        <th key={idx}>M{idx + 1}</th>
                      ))}
                      <th>Total Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalRankings.map((entry) => {
                      const isTopThree = entry.rank <= 3;
                      return (
                        <tr
                          key={entry.participantId}
                          className={isTopThree ? `rank-${entry.rank}` : ""}
                        >
                          <td className="rank-cell">
                            {entry.rank === 1 && "🥇"}
                            {entry.rank === 2 && "🥈"}
                            {entry.rank === 3 && "🥉"}
                            {entry.rank > 3 && entry.rank}
                          </td>
                          <td className="name-cell">{entry.participantName}</td>
                          {entry.matchPoints.map((points, matchIdx) => (
                            <td key={matchIdx} className="match-points-cell">
                              {points || "-"}
                            </td>
                          ))}
                          <td className="total-points-cell">
                            {entry.totalPoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="form-error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="result-declaration-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            📢 Publish Results
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ResultDeclaration;
