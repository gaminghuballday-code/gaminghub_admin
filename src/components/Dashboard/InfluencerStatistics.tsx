import type { FC } from 'react';
import type { InfluencerStatisticsData } from '@services/api';
import Loading from '@components/common/Loading';
import StatCard from './StatCard';
import './InfluencerStatistics.scss';

export interface InfluencerStatisticsProps {
  stats: InfluencerStatisticsData | undefined;
  loading: boolean;
  error: string | null;
}

const InfluencerStatistics: FC<InfluencerStatisticsProps> = ({ stats, loading, error }) => {
  const accounts = stats?.influencerAccounts ?? 0;
  const referrals = stats?.paidReferralsCount ?? 0;
  const gcPaid = stats?.totalGcPaidToInfluencers ?? 0;

  return (
    <div className="dashboard-card influencer-statistics">
      <div className="card-header-with-filters">
        <h2 className="card-title">Influencer statistics</h2>
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
      )}
    </div>
  );
};

export default InfluencerStatistics;
