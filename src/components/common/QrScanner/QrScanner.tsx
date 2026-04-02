import { type FC, useEffect, useId, useMemo } from 'react';
import { Html5Qrcode, type QrcodeErrorCallback, type QrcodeSuccessCallback } from 'html5-qrcode';
import './QrScanner.scss';

interface QrScannerProps {
  className?: string;
  /** Called when a QR is successfully decoded. */
  onResult: (decodedText: string) => void;
  /** Optional error callback (scan errors are frequent; keep this lightweight). */
  onError?: (message: string) => void;
  /** Frames per second for scanning (default 10). */
  fps?: number;
  /** Square size for detection box in px (default 240). */
  qrboxSize?: number;
  /** Small watermark text shown inside scanner UI. */
  watermarkText?: string;
}

export const QrScanner: FC<QrScannerProps> = ({
  className,
  onResult,
  onError,
  fps = 10,
  qrboxSize = 240,
  watermarkText = 'Booyah X',
}) => {
  const reactId = useId();
  const elementId = useMemo(() => `qr-scanner-${reactId.replace(/:/g, '')}`, [reactId]);
  const watermark = useMemo(() => watermarkText.trim() || 'Booyah X', [watermarkText]);
  const watermarkParts = useMemo(() => {
    if (/\s*x\s*$/i.test(watermark)) {
      const base = watermark.replace(/\s*x\s*$/i, '').trimEnd();
      return { base, x: 'X' };
    }
    return { base: watermark, x: '' };
  }, [watermark]);

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    let cancelled = false;

    const onSuccess: QrcodeSuccessCallback = (decodedText) => {
      onResult(decodedText);
    };

    const onScanError: QrcodeErrorCallback = (errorMessage) => {
      if (onError) onError(errorMessage);
    };

    const start = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        const preferredCamera = cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[0];
        if (!preferredCamera) return;

        await scanner.start(
          { deviceId: { exact: preferredCamera.id } },
          {
            fps,
            qrbox: { width: qrboxSize, height: qrboxSize },
            aspectRatio: 1.0,
            disableFlip: true,
          },
          onSuccess,
          onScanError
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (onError) onError(msg);
      }
    };

    void start();

    return () => {
      cancelled = true;
      void scanner
        .stop()
        .catch(() => undefined)
        .finally(() => {
          scanner.clear();
        });
    };
  }, [elementId, fps, onError, onResult, qrboxSize]);

  const rootClass = ['qr-scanner', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="qr-scanner__viewport">
        <div id={elementId} className="qr-scanner__mount" />
        <div className="qr-scanner__watermark" aria-hidden>
          {watermarkParts.base} {watermarkParts.x ? <em>{watermarkParts.x}</em> : null}
        </div>
      </div>
    </div>
  );
};

