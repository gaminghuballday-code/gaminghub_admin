/**
 * Subject values for POST /api/inquiry — shared by public enquiry forms and admin filters.
 */
export interface InquirySubjectOption {
  value: string;
  label: string;
}

export const INQUIRY_SUBJECT_OPTIONS: readonly InquirySubjectOption[] = [
  { value: 'general', label: 'General enquiry' },
  { value: 'influencer', label: 'Influencer / creator program' },
  { value: 'support', label: 'Technical support' },
  { value: 'billing', label: 'Billing / payment' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'download', label: 'Download / APK' },
  { value: 'other', label: 'Other' },
] as const;

const labelByValue = new Map(INQUIRY_SUBJECT_OPTIONS.map((o) => [o.value, o.label]));

export function getInquirySubjectLabel(subject: string): string {
  const key = subject.trim();
  return labelByValue.get(key) ?? subject;
}
