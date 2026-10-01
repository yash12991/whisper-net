/**
 * WhisperNet Frontend Environment & Network Configuration
 * Ensures robust URL normalization across local and production deployments.
 */

export const getApiUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_URL = getApiUrl();
