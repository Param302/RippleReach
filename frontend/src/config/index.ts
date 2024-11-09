export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Add other global constants here
export const APP_NAME = 'RippleReach';
export const API_ENDPOINTS = {
  dashboard: '/',
  sendEmails: '/api/send_emails',
  // ... other endpoints
} as const; 