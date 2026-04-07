export interface NotificationPreset {
  id: string;
  name: string;
  title: string;
  message: string;
}

/**
 * Default copy admins can send in one tap or save to the server-side template list.
 * Edit these strings to match your product voice.
 */
export const ADMIN_NOTIFICATION_PRESETS: readonly NotificationPreset[] = [
  {
    id: 'new-tournament',
    name: 'New tournament',
    title: 'New tournament is live!',
    message:
      'A new tournament is now open on Booyahx. Open the app to register, check the prize pool, and compete.',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    title: 'Scheduled maintenance',
    message:
      'We are performing a short update. The app may be unavailable briefly. Thank you for your patience.',
  },
  {
    id: 'results',
    name: 'Results / winners',
    title: 'Results are out!',
    message:
      'Latest tournament results and rewards are available. Open Booyahx to see if you placed and claim your winnings.',
  },
  {
    id: 'comeback',
    name: 'Re-engagement',
    title: 'Jump back in!',
    message:
      'New events and rewards are waiting for you on Booyahx. Open the app so you do not miss the action.',
  },
] as const;
