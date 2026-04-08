import type { FC } from 'react';
import './NoDataFound.scss';

interface NoDataFoundProps {
  message?: string;
  className?: string;
}

const NoDataFound: FC<NoDataFoundProps> = ({ message = 'No Data Found', className }) => {
  return (
    <div className={`no-data-found ${className || ''}`.trim()}>
      <p className="no-data-found__text">{message}</p>
    </div>
  );
};

export default NoDataFound;
