import React from 'react';
import { type Tournament } from '@services/api';
import { Modal } from '@components/common/Modal';
import './TournamentResults.scss';

interface TournamentResultsProps {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
}

interface ResultRanking {
  rank: number;
  participantId: string;
  participantName: string;
  totalPoints: number;
  matchPoints: number[];
}

const TournamentResults: React.FC<TournamentResultsProps> = ({
  isOpen,
  tournament,
  onClose,
}) => {
  if (!tournament) return null;

  // Extract results from tournament
  // Assuming backend sends results in this format after declaration
  const results = (tournament as any).finalRankings || (tournament as any).results || [];
  const isTeamBased = tournament.subMode?.toLowerCase() === 'squad' || tournament.subMode?.toLowerCase() === 'duo';

  // If results is an array of rankings
  const rankings: ResultRanking[] = Array.isArray(results) && results.length > 0 && typeof results[0] === 'object' && 'rank' in results[0]
    ? results as ResultRanking[]
    : [];

  const hasResults = rankings.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="modal-extra-large"
      title="🏆 Tournament Results"
      showCloseButton={true}
    >
      <div className="tournament-results-body">
        <div className="results-header">
          <div className="tournament-info">
            <h3>{tournament.game} - {tournament.mode} {tournament.subMode}</h3>
            <p>
              <strong>Date:</strong> {tournament.date ? new Date(tournament.date).toLocaleDateString() : 'N/A'}
            </p>
            <p>
              <strong>Prize Pool:</strong> ₹{tournament.winnerPrizePool ?? tournament.prizePool ?? 0}
            </p>
          </div>
        </div>

        {hasResults ? (
          <>
            {/* Top 3 Winners */}
            {rankings.filter(r => r.rank <= 3).length > 0 && (
              <div className="winners-section">
                <h4 className="winners-title">🏆 Top 3 Winners</h4>
                <div className="winners-grid">
                  {rankings
                    .filter(r => r.rank <= 3)
                    .map((ranking) => (
                      <div key={ranking.participantId} className={`winner-card rank-${ranking.rank}`}>
                        <div className="winner-medal">
                          {ranking.rank === 1 && '🥇'}
                          {ranking.rank === 2 && '🥈'}
                          {ranking.rank === 3 && '🥉'}
                        </div>
                        <div className="winner-rank">#{ranking.rank}</div>
                        <div className="winner-name">{ranking.participantName}</div>
                        <div className="winner-points">{ranking.totalPoints} Points</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="rankings-section">
              <h4 className="rankings-title">Complete Rankings</h4>
              <div className="rankings-container">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>{isTeamBased ? 'Team' : 'Player'}</th>
                      {rankings[0]?.matchPoints.map((_, idx) => (
                        <th key={idx}>Match {idx + 1}</th>
                      ))}
                      <th>Total Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((ranking) => {
                      const isTopThree = ranking.rank <= 3;
                      return (
                        <tr key={ranking.participantId} className={isTopThree ? `rank-${ranking.rank}` : ''}>
                          <td className="rank-cell">
                            {ranking.rank === 1 && '🥇'}
                            {ranking.rank === 2 && '🥈'}
                            {ranking.rank === 3 && '🥉'}
                            {ranking.rank > 3 && ranking.rank}
                          </td>
                          <td className="name-cell">{ranking.participantName}</td>
                          {ranking.matchPoints.map((points, matchIdx) => (
                            <td key={matchIdx} className="match-points-cell">
                              {points || '-'}
                            </td>
                          ))}
                          <td className="total-points-cell">{ranking.totalPoints}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        ) : (
          <div className="no-results">
            <p>Results are not available yet.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TournamentResults;

