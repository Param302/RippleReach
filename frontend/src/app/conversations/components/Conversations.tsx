'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { API_URL } from '@/config';

interface Lead {
    email: string;
    name: string;
    company_name: string;
    company_domain: string;
    role: string;
    company_size: string;
    email_status: "active" | "replied";
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'new': return 'bg-[rgb(var(--status-new)/0.2)] text-blue-700';
        case 'sent': return 'bg-[rgb(var(--status-sent)/0.2)] text-green-700';
        case 'replied': return 'bg-[rgb(var(--status-replied)/0.2)] text-purple-700';
        case 'active': return 'bg-[rgb(var(--status-active)/0.2)] text-yellow-700';
        case 'failed': return 'bg-[rgb(var(--status-failed)/0.2)] text-red-700';
        case 'generating': return 'bg-orange-100 text-orange-700';
        case 'sending': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const StatusDisplay = ({ status }: { status: string }) => (
    <span className={`px-4 py-1 rounded-full text-xs flex items-center gap-2 ${getStatusColor(status)}`}>
        {status}
    </span>
);

export default function Conversations() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const response = await fetch(`${API_URL}/api/leads/active-replied`, {
                    cache: 'no-store',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                console.log(data);
                setLeads(data.leads);
            } catch (error) {
                console.error('Error fetching leads:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    return (
        <main className="grid grid-cols-[1fr_3fr] h-screen">
            <section key="leads-panel" className="border-r border-gray-200 overflow-y-scroll">
                <h2 className="text-xl font-bold p-4 border-b bg-gray-200">Conversations</h2>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    leads.map((lead) => (
                        <div key={lead.email} className="mb-2 grid border-b grid-rows-2 grid-cols-[4fr_1fr] p-4 cursor-pointer hover:bg-gray-100" onClick={() => setSelectedLead(lead)}>
                            <div className="text-md font-semibold">{lead.name}</div>
                            <div className="w-fit">
                                <StatusDisplay status={lead.email_status}/>
                            </div>
                            <div className="text-sm text-gray-500">{lead.role} at <a href={`https://${lead.company_domain}`} target="_blank" className="underline">{lead.company_name}</a></div>
                        </div>
                    ))
                )}
            </section>

            <section key="conversations-panel" className="w-2/3 p-4">
                {selectedLead ? (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Conversations with {selectedLead.name}</h2>
                        {/* Here you can add the chat interface */}
                        <div className="border rounded-lg p-4 h-full">
                            <p>Chat messages will appear here...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Card className="p-6 text-center">
                            <CardContent>
                                <h3 className="text-lg font-semibold">Select a lead to see conversations</h3>
                                <p className="text-gray-500">Click on a lead from the left panel.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </section>
        </main>
    );
} 