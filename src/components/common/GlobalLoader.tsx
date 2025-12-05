import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import './GlobalLoader.scss';

const GlobalLoader: React.FC = () => {
  // Check if any queries are fetching or mutations are pending
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  // Determine loading message based on what's happening
  const getLoadingMessage = () => {
    if (isMutating > 0) {
      return 'Processing...';
    }
    if (isFetching > 0) {
      return 'Loading...';
    }
    return 'Please wait...';
  };

  return (
    <div className="global-loader-overlay">
      <div className="global-loader-content">
        <div className="global-loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="global-loader-text">{getLoadingMessage()}</p>
      </div>
    </div>
  );
};

export default GlobalLoader;

