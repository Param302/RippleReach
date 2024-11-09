import '@/app/globals.css';
import Link from 'next/link'
import { API_URL, API_ENDPOINTS } from '@/config';

interface DashboardProps {
  totalLeads: number;
  outreach: number;
  conversations: number;
}

async function getDashboardData() {
  const res = await fetch(`${API_URL}${API_ENDPOINTS.dashboard}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export default async function Dashboard() {
  const { totalLeads, outreach, conversations } = await getDashboardData()
  
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <section className="mb-8">
        <p>Total leads: {totalLeads}</p>
        <p>Outreach: {outreach}</p>
        <p>Conversations: {conversations}</p>
      </section>

      <h2 className="text-xl font-semibold mb-4">Actions</h2>
      <section className="flex gap-4">
        <Link 
          href="/send_emails" 
          className="text-blue-600 hover:underline"
        >
          Send cold emails
        </Link>
        <Link 
          href="/monitor" 
          className="text-blue-600 hover:underline"
        >
          Monitor replies
        </Link>
        <Link 
          href="/replies" 
          className="text-blue-600 hover:underline"
        >
          Send replies
        </Link>
      </section>
    </main>
  )
}
