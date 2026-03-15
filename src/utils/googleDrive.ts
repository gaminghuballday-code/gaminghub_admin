/**
 * Extracts Google Drive file ID from share/view links and returns direct download URL.
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - Raw file ID (e.g. 1ABC123xyz)
 *
 * Direct download URL format: https://drive.google.com/uc?export=download&id=FILE_ID
 * Use this so "Download APK" triggers file download instead of opening Drive preview.
 */
const DRIVE_FILE_ID_REGEX = /(?:^|\/)(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]{20,})(?:\/|&|$)/;
const DRIVE_RAW_ID_REGEX = /^[a-zA-Z0-9_-]{20,}$/;

export function getGoogleDriveDirectDownloadUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Already a direct download link — return as-is (optional: could normalize to same format)
  if (trimmed.includes('export=download')) return trimmed;

  // Try to extract file ID from share/view URLs
  const match = trimmed.match(DRIVE_FILE_ID_REGEX);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // Plain file ID (no URL)
  if (DRIVE_RAW_ID_REGEX.test(trimmed)) {
    return `https://drive.google.com/uc?export=download&id=${trimmed}`;
  }

  // Not a recognized Drive link — return original (e.g. direct APK URL from own server)
  return trimmed;
}
