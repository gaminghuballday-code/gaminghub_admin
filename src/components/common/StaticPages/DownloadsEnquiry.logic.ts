export const INQUIRY_MESSAGE_MIN = 10;
export const INQUIRY_MESSAGE_MAX = 5000;

export function validateInquiryMessage(message: string): string | null {
  const t = message.trim();
  if (t.length < INQUIRY_MESSAGE_MIN) {
    return `Message must be at least ${INQUIRY_MESSAGE_MIN} characters.`;
  }
  if (t.length > INQUIRY_MESSAGE_MAX) {
    return `Message must be at most ${INQUIRY_MESSAGE_MAX} characters.`;
  }
  return null;
}
