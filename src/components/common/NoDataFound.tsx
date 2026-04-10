import type { FC } from 'react';
import './NoDataFound.scss';

export type NoDataFoundVariant = 'default' | 'panel';

interface NoDataFoundProps {
  message?: string;
  className?: string;
  /** `panel` — bordered inset block (modals, lists). `default` — minimal text block. */
  variant?: NoDataFoundVariant;
}

const NoDataFound: FC<NoDataFoundProps> = ({
  message = 'No Data Found',
  className,
  variant = 'default',
}) => {
  const variantClass = variant === 'panel' ? 'no-data-found--panel' : '';
  return (
    <div
      className={`no-data-found ${variantClass} ${className || ''}`.trim()}
      data-component="no-data-found"
    >
      <p className="no-data-found__text">{message}</p>
    </div>
  );
};

export default NoDataFound;
