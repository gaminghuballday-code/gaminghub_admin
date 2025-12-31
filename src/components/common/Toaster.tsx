import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectToasts, removeToast, clearToasts } from '@store/slices/toastSlice';
import type { Toast as ToastType } from '@store/slices/toastSlice';
import Toast from './Toast';
import './Toaster.scss';

const DEBOUNCE_DURATION = 3000; // 3 seconds

const Toaster: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const toasts = useAppSelector(selectToasts);
  const [displayedToast, setDisplayedToast] = useState<ToastType | null>(null);
  const [canShowNext, setCanShowNext] = useState(true);
  const debounceTimerRef = useRef<number | null>(null);
  const prevLocationRef = useRef<string>(location.pathname);

  // Clear all toasts when route changes
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      dispatch(clearToasts());
      setDisplayedToast(null);
      setCanShowNext(true);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname, dispatch]);

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Check if current displayed toast was removed from queue
    if (displayedToast) {
      const isStillInQueue = toasts.some((t) => t.id === displayedToast.id);
      if (!isStillInQueue) {
        // Toast was removed, start debounce period before showing next
        setDisplayedToast(null);
        setCanShowNext(false);
        debounceTimerRef.current = window.setTimeout(() => {
          setCanShowNext(true);
        }, DEBOUNCE_DURATION);
        return;
      }

      // If a new error toast arrives while one is already displayed, close current and start debounce
      const firstToast = toasts[0];
      if (firstToast && firstToast.id !== displayedToast.id && firstToast.type === 'error') {
        // Close current toast immediately (regardless of its type)
        dispatch(removeToast(displayedToast.id));
        setDisplayedToast(null);
        setCanShowNext(false);
        // Start 3 second debounce before showing new error toast
        debounceTimerRef.current = window.setTimeout(() => {
          setCanShowNext(true);
        }, DEBOUNCE_DURATION);
        return;
      }
    }

    // If we can show next toast and there are toasts available
    if (canShowNext && toasts.length > 0) {
      const firstToast = toasts[0];
      
      // If no toast is displayed, show the first one
      if (!displayedToast) {
        setDisplayedToast(firstToast);
        setCanShowNext(false);
        return;
      }

      // If displayed toast is different from first in queue, a new one was added
      // but we need to wait for current one to be removed first (handled above)
    }
  }, [toasts, displayedToast, canShowNext, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };

  }, []);

  if (!displayedToast) {
    return null;
  }

  // Ensure minimum duration of 3 seconds
  const toastWithMinDuration: ToastType = {
    ...displayedToast,
    duration: Math.max(displayedToast.duration || 5000, DEBOUNCE_DURATION),
  };

  return (
    <div className="toaster" aria-live="polite" aria-atomic="true">
      <Toast key={displayedToast.id} toast={toastWithMinDuration} />
    </div>
  );
};

export default Toaster;

