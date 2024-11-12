import '@/app/globals.css';
import Link from 'next/link';
import { API_URL, API_ENDPOINTS } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Mail, Monitor, Reply, Inbox, Users, SendHorizontal, MessageSquare, Settings } from "lucide-react";

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
  const { total_leads, outreach, conversations } = await getDashboardData()
  
  const stats = [
    {
      title: "Leads",
      value: total_leads,
      icon: <Users className="h-7 w-7 text-blue-500" />,
    },
    {
      title: "Outreach",
      value: outreach,
      icon: <SendHorizontal className="h-7 w-7 text-green-500" />,
    },
    {
      title: "Conversations",
      value: conversations,
      icon: <MessageSquare className="h-7 w-7 text-purple-500" />,
    },
  ];

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="w-3/5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="flex flex-row items-center justify-left pl-4 cursor-default">
                  {stat.icon}
                <div className="flex flex-col">
                  <CardHeader className="pb-2 flex items-center">
                    <CardTitle className="text-lg font-semibold text-muted-foreground">
                        {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold text-primary">
                      {stat.value}
                  </CardContent>
                </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Cold Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Send automated cold emails to your leads
              </p>
              <Link 
                href="/send_emails"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 group"
              >
                Send Emails <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Monitor Replies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor your email inbox for new messages
              </p>
              <Link 
                href="/monitor_emails"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 group"
              >
                View Replies <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Reply className="h-5 w-5" />
                Send Replies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage and send responses to incoming messages
              </p>
              <Link 
                href="/replies"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 group"
              >
                Respond Now <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Chat and close deals with your leads
              </p>
              <Link 
                href="/conversations"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 group"
              >
                Chat Now <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configure Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure and manage your email accounts
              </p>
              <Link 
                href="/configure_emails"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 group"
              >
                Configure <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
