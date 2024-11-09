import { API_URL, API_ENDPOINTS } from '@/config';
import SendEmailsClient from './components/send-emails-client';

export default async function SendEmailsPage() {
  const leads = await getLeads();
  return <SendEmailsClient leads={leads} />;
}

async function getLeads() {
  const res = await fetch(`${API_URL}${API_ENDPOINTS.sendEmails}`, {
    cache: 'force-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
} 