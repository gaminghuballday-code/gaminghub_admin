import { useAppSelector } from '@store/hooks';
import { selectToasts } from '@store/slices/toastSlice';
import Toast from './Toast';
import './Toaster.scss';

const Toaster: React.FC = () => {
  const toasts = useAppSelector(selectToasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toaster" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default Toaster;

