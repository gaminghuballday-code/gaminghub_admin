import { type FC, useEffect, useMemo, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { getDownloadsAbsoluteUrl } from '@utils/constants';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import './ApkDownloadQr.scss';

interface ApkDownloadQrProps {
  /** Pixel size of the QR square (default 176) */
  size?: number;
  className?: string;
}

export const ApkDownloadQr: FC<ApkDownloadQrProps> = ({ size = 200, className }) => {
  const dispatch = useAppDispatch();
  const qrValue = useMemo(() => {
    const base = getDownloadsAbsoluteUrl();
    if (!base) return '';
    const hasQuery = base.includes('?');
    return `${base}${hasQuery ? '&' : '?'}apk=1#download`;
  }, []);

  if (!qrValue) return null;

  const getQrConfig = (px: number, type: 'svg' | 'canvas') => ({
    width: px,
    height: px,
    type,
    data: qrValue,
    margin: 0,
    image: '/favicon.png',
    qrOptions: {
      errorCorrectionLevel: 'M' as const,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.32,
      margin: 6,
    },
    dotsOptions: {
      type: 'rounded' as const,
      color: '#001018',
      gradient: {
        type: 'radial' as const,
        rotation: 0,
        colorStops: [
          { offset: 0, color: '#00e5ff' },
          { offset: 0.55, color: '#00c8ff' },
          { offset: 1, color: '#006eff' },
        ],
      },
    },
    cornersSquareOptions: {
      type: 'extra-rounded' as const,
      color: '#006eff',
    },
    cornersDotOptions: {
      type: 'dot' as const,
      color: '#00c8ff',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
  });

  const rootClass = ['apk-download-qr', className].filter(Boolean).join(' ');
  const mountRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // SVG keeps the QR crisp at any zoom level (canvas will pixelate).
    const qr = new QRCodeStyling(getQrConfig(size, 'svg'));

    mountRef.current.innerHTML = '';
    qr.append(mountRef.current);
    qrRef.current = qr;

    return () => {
      qrRef.current = null;
      mountRef.current?.replaceChildren();
    };
  }, [qrValue, size]);

  const handleDownloadQr = async () => {
    try {
      // Generate a dedicated high-res QR for scanner-friendly downloads.
      // (On-screen QR remains small and SVG-based.)
      const downloadSize = Math.max(1024, size * 6);
      const downloadQr = new QRCodeStyling(getQrConfig(downloadSize, 'canvas'));
      const blob = await downloadQr.getRawData('png');
      if (!blob) {
        dispatch(
          addToast({
            message: 'Failed to generate QR. Please try again.',
            type: 'error',
            duration: 4500,
          })
        );
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BooyahX-QR-1024.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      dispatch(
        addToast({
          message: 'Failed to download QR. Please try again.',
          type: 'error',
          duration: 4500,
        })
      );
    }
  };

  const handleShareLink = async () => {
    const url = qrValue;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'BooyahX APK Download',
          text: 'Download BooyahX APK',
          url,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return;
      }

      dispatch(
        addToast({
          message: 'Sharing not supported on this browser',
          type: 'warning',
          duration: 4500,
        })
      );
    } catch {
      dispatch(
        addToast({
          message: 'Failed to share link. Please try again.',
          type: 'error',
          duration: 4500,
        })
      );
    }
  };

  return (
    <div className={rootClass}>
      <p className="apk-download-qr__caption">Scan with your phone to download the APK</p>
      <div className="apk-download-qr__frame">
        <div ref={mountRef} role="img" aria-label="QR code linking to BooyahX downloads page" />
      </div>
      <div className="apk-download-qr__actions">
        <button type="button" className="apk-download-qr__action-btn" onClick={handleDownloadQr}>
          Download QR
        </button>
        <button type="button" className="apk-download-qr__action-btn" onClick={handleShareLink}>
          Share link
        </button>
      </div>
      <div className="apk-download-qr__brand" aria-hidden>
        Booyah <em>X</em>
      </div>
    </div>
  );
};
