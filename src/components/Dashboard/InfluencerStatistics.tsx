import type { FC } from 'react';
import type { InfluencerStatisticsData } from '@services/api';
import Loading from '@components/common/Loading';
import { Button } from '@components/common/Button';
import StatCard from './StatCard';
import './InfluencerStatistics.scss';

export interface InfluencerStatisticsProps {
  stats: InfluencerStatisticsData | undefined;
  loading: boolean;
  error: string | null;
  emailInput: string;
  appliedEmail: string;
  onEmailChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

const InfluencerStatistics: FC<InfluencerStatisticsProps> = ({
  stats,
  loading,
  error,
  emailInput,
  appliedEmail,
  onEmailChange,
  onSearch,
  onClearSearch,
}) => {
  const accounts = stats?.influencerAccounts ?? 0;
  const referrals = stats?.paidReferralsCount ?? 0;
  const gcPaid = stats?.totalGcPaidToInfluencers ?? 0;
  const platformSummary = stats?.platformSummary;
  const influencers = stats?.influencers ?? [];
  const hasActiveFilter = appliedEmail.trim().length > 0;

  return (
    <div className="dashboard-card influencer-statistics">
      <div className="card-header-with-filters">
        <h2 className="card-title">Influencer statistics</h2>
      </div>

      <div className="influencer-statistics__toolbar">
        <div className="query-input-group">
          <input
            type="search"
            className="query-input"
            placeholder="Search by influencer email…"
            value={emailInput}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearch();
              }
            }}
            disabled={loading}
            aria-label="Filter statistics by influencer email"
          />
          <Button variant="primary" onClick={onSearch} disabled={loading}>
            Search
          </Button>
          <Button
            variant="secondary"
            onClick={onClearSearch}
            disabled={loading || (!emailInput.trim() && !appliedEmail.trim())}
          >
            Clear
          </Button>
        </div>
        {hasActiveFilter && (
          <p className="influencer-statistics__filter-hint">
            Showing scoped stats for <strong>{appliedEmail.trim()}</strong>
          </p>
        )}
        {platformSummary && (
          <p className="influencer-statistics__platform-hint">
            Platform-wide:{' '}
            <span>
              {platformSummary.totalInfluencers.toLocaleString()} influencer accounts ·{' '}
              {platformSummary.totalPaidReferrals.toLocaleString()} paid referrals (all-time)
            </span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="influencer-statistics__loading">
          <Loading />
        </div>
      ) : error ? (
        <div className="influencer-statistics__error" role="alert">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="stats-grid stats-grid--influencer-tab">
            <StatCard
              title="Influencer accounts"
              value={accounts.toLocaleString()}
              color="primary"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <StatCard
              title="Paid referrals"
              value={referrals.toLocaleString()}
              color="success"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
              }
            />
            <StatCard
              title="Total GC paid to influencers"
              value={`${gcPaid.toLocaleString()} GC`}
              color="warning"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12" />
                  <path d="M8 10h8" />
                  <path d="M8 14h5" />
                </svg>
              }
            />
          </div>

          {influencers.length > 0 && (
            <div className="influencer-statistics__records">
              <h3 className="influencer-statistics__records-title">Matching records</h3>
              <div className="influencer-statistics__table-wrap">
                <table className="influencer-statistics__table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Paid referrals</th>
                      <th scope="col">GC paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencers.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name ?? '—'}</td>
                        <td>{row.email}</td>
                        <td>
                          {row.paidReferralsCount !== undefined
                            ? row.paidReferralsCount.toLocaleString()
                            : '—'}
                        </td>
                        <td>
                          {row.totalGcPaidToInfluencers !== undefined
                            ? `${row.totalGcPaidToInfluencers.toLocaleString()} GC`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasActiveFilter && influencers.length === 0 && (
            <p className="influencer-statistics__no-rows">
              No per-influencer row returned for this email. Summary cards above still reflect the API scope.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default InfluencerStatistics;
