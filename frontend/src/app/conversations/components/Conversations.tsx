'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { API_URL } from '@/config';

interface Lead {
    cold_email_subject: string;
    company_background: string;
    company_domain: string;
    company_name: string;
    company_size: number;
    conversation_history: string;
    email: string;
    email_content: string;
    email_status: "active" | "replied"; // Adjust based on possible values
    follow_up_needed: string;
    html_email_content: string;
    headline: string;
    industry: string;
    last_message: string;
    last_message_id: string;
    last_sender: string;
    message_id: string;
    name: string;
    proposal: string;
    response: string;
    response_subject: string;
    role: string;
    sender_email: string;
    thread_id: string;
    thread_subject: string;
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
    const [leads, setLeads] = useState<{ [key: string]: Lead }>({});
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${API_URL}/api/leads/conversations`, {
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

    const refreshLeads = async () => {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/leads/monitor`, {
            cache: 'no-store',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        setLeads(data.leads);
        console.log(data);
        setLoading(false);
    }

    const parseConversationHistory = (history: string) => {
        // Ensure history is a string before parsing
        if (typeof history !== 'string') return {};
        try {
            return JSON.parse(history); // Directly parse the JSON string
        } catch (error) {
            console.error('Error parsing conversation history:', error);
            return {};
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    return (
        <main className="grid grid-cols-[1fr_3fr] h-screen max-h-[93vh]">
            <section key="leads-panel" className="border-r border-gray-200 overflow-y-scroll">
                <div className="flex justify-between items-center p-4 border-b bg-gray-200">
                    <h2 className="text-xl font-bold">Conversations</h2>
                    <Button
                        onClick={refreshLeads}
                        className="text-md font-medium flex items-center gap-2"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    Object.entries(leads).map(([email, lead]) => (
                        <div key={email} className="grid border-b grid-rows-2 grid-cols-[4fr_1fr] p-4 cursor-pointer bg-gray-50 hover:bg-gray-100" onClick={() => setSelectedLead(lead)}>
                            <div className="text-md font-semibold">{lead.name}</div>
                            <div className="w-fit">
                                <StatusDisplay status={lead.email_status}/>
                            </div>
                            <div className="text-sm text-gray-500">{lead.role} at <a href={`https://${lead.company_domain}`} target="_blank" className="underline">{lead.company_name}</a></div>
                        </div>
                    ))
                )}
            </section>

            <section key="conversations-panel" className="p-4">
                {selectedLead ? (
                    <div className="flex flex-col h-full">
                        <div className="flex gap-4">
                            <h2 className="text-2xl font-bold mb-2">
                                Conversations with {selectedLead.name}
                            </h2>
                            <div className="flex mb-4 p-2 bg-gray-100 rounded-lg">
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedLead.role} at <span className="font-semibold">{selectedLead.company_name}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Client Email: <span className="font-semibold">{selectedLead.email}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Our Email: <span className="font-semibold">{selectedLead.sender_email}</span>
                                </p>
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 flex-1 h-fit overflow-y-scroll bg-white shadow-md max-h-[50vh]">
                            {selectedLead && parseConversationHistory(selectedLead.conversation_history) && 
                                Object.entries(parseConversationHistory(selectedLead.conversation_history))
                                    .sort(([timestampA], [timestampB]) => new Date(timestampA).getTime() - new Date(timestampB).getTime())
                                    .map(([timestamp, { sender, message }]: [string, { sender: string; message: string }]) => (
                                        <div key={timestamp} className={`flex ${sender === selectedLead.sender_email ? 'justify-end' : 'justify-start'} mb-2 w-full`}>
                                            <div className={`p-3 rounded-lg ${sender === selectedLead.sender_email ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'} w-fit max-w-[60%]`}>
                                                <p className="text-sm whitespace-pre-wrap">{message.trim().split('\n').map((line, index) => (
                                                    <span key={index}>
                                                        {line}
                                                        <br />
                                                    </span>
                                                ))}</p>
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                        <div className="mt-4">
                            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200">
                                Generate
                            </button>
                            <p className="text-gray-500 mt-2">Analyze the conversation and generate a reply</p>
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