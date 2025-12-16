import type { Tournament } from '@services/api';

/**
 * Calculate the time when tournament should go live (10 minutes before start time)
 */
export const getTournamentLiveTime = (tournament: Tournament): Date | null => {
  if (!tournament.date || !tournament.startTime) {
    return null;
  }

  try {
    // Parse date and time
    const dateStr = tournament.date; // YYYY-MM-DD format
    const timeStr = tournament.startTime; // HH:MM format (24-hour)

    // Combine date and time
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const startDateTime = new Date(dateTimeStr);

    // Subtract 10 minutes (600000 ms)
    const liveTime = new Date(startDateTime.getTime() - 10 * 60 * 1000);

    return liveTime;
  } catch (error) {
    console.error('Error parsing tournament date/time:', error);
    return null;
  }
};

/**
 * Calculate the tournament start time
 */
export const getTournamentStartTime = (tournament: Tournament): Date | null => {
  if (!tournament.date || !tournament.startTime) {
    return null;
  }

  try {
    const dateStr = tournament.date;
    const timeStr = tournament.startTime;
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    return new Date(dateTimeStr);
  } catch (error) {
    console.error('Error parsing tournament start time:', error);
    return null;
  }
};

/**
 * Get time remaining until tournament goes live (in milliseconds)
 */
export const getTimeUntilLive = (tournament: Tournament): number | null => {
  const liveTime = getTournamentLiveTime(tournament);
  if (!liveTime) return null;

  const now = new Date();
  const diff = liveTime.getTime() - now.getTime();
  return diff > 0 ? diff : 0;
};

/**
 * Get time remaining until tournament starts (in milliseconds)
 */
export const getTimeUntilStart = (tournament: Tournament): number | null => {
  const startTime = getTournamentStartTime(tournament);
  if (!startTime) return null;

  const now = new Date();
  const diff = startTime.getTime() - now.getTime();
  return diff > 0 ? diff : 0;
};

/**
 * Format time remaining as HH:MM:SS
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return '00:00:00';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Check if tournament should be live based on current time
 */
export const shouldTournamentBeLive = (tournament: Tournament): boolean => {
  const liveTime = getTournamentLiveTime(tournament);
  if (!liveTime) return false;

  const now = new Date();
  return now >= liveTime;
};

/**
 * Check if tournament has started
 */
export const hasTournamentStarted = (tournament: Tournament): boolean => {
  const startTime = getTournamentStartTime(tournament);
  if (!startTime) return false;

  const now = new Date();
  return now >= startTime;
};

