'use client';

import '@/app/globals.css';
import { useState } from "react";
import { API_URL } from "@/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, ChevronUp, Loader2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Lead {
    email: string;
    name: string;
    company_name: string;
    company_domain: string;
    role: string;
    company_size: string;
    email_status: string;
}
// create an array having all the headers of the table
const tableHeaders = ['Name', 'Email', 'Company', 'Website', 'Role', 'Status'];

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

interface LeadDetails {
    basic_info: {
        email: string;
        name: string;
        role: string;
        headline: string;
    };
    company_info: {
        company_name: string;
        company_domain: string;
        company_size: string;
        industry: string;
        company_description: string;
    };
    email_status: {
        status: string;
        last_message: string;
        email_subject: string;
        email_content: string;
        sender_email: string;
    };
}

export default function SendEmailsClient({ leads }: { leads: Lead[] }) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [leadDetails, setLeadDetails] = useState<LeadDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [emailContent, setEmailContent] = useState({ subject: '', email: '' });

    const fetchLeadDetails = async (email: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/lead/${email}/details`);
            const data = await response.json();
            console.log(data);
            setLeadDetails(data);
            const lead = leads.find(lead => lead.email === email);
        } catch (error) {
            console.error('Error fetching lead details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateEmail = async (email: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch(`${API_URL}/api/lead/${email}/generate-email`, {
                method: 'POST',
            });
            const data = await response.json();
            console.log(data);
            setEmailContent(data);
        } catch (error) {
            console.error('Error generating email:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const sendEmail = async (email: string) => {
        document.getElementById(`generate-email-btn-${email}`)?.setAttribute('disabled', 'true');
        document.getElementById(`subject-input-${email}`)?.setAttribute('disabled', 'true');
        document.getElementById(`email-input-${email}`)?.setAttribute('disabled', 'true');

        setIsSending(true);
        try {
            await fetch(`${API_URL}/api/lead/${email}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailContent),
            });
            await fetchLeadDetails(email);
        } catch (error) {
            console.error('Error sending email:', error);
        } finally {
            const lead = leads.find(lead => lead.email === email);
            if (lead) {
                lead.email_status = 'Sent';
            }
            setIsSending(false);
        }
    };

    const autoSendEmails = async () => {
        for (const lead of leads) {
            if (lead.email_status.toLowerCase() === 'new') {
                lead.email_status = 'Generating';
                await generateEmail(lead.email);
                if (emailContent.subject && emailContent.email) {
                    lead.email_status = 'Sending';
                    await sendEmail(lead.email);
                }
            }
        }
    };

    const StatusDisplay = ({ status }: { status: string }) => (
        <span className={`px-4 py-1 rounded-full text-xs flex items-center gap-2 ${getStatusColor(status)}`}>
            {(status.toLowerCase() === 'generating' || status.toLowerCase() === 'sending') && (
                <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {status}
        </span>
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Send Cold Emails</h1>
                <Button onClick={autoSendEmails}>
                    Auto Send Cold Emails
                </Button>
            </div>

            <div key="leads-data" className="bg-white rounded-lg shadow relative">
                <div className="grid grid-cols-[150px_1fr_1fr_1fr_1fr_150px] bg-gray-100 border-b sticky top-0 rounded-t-lg overflow-hidden">
                    {tableHeaders.map((header) => (
                        <div key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-500 tracking-wider hover:bg-gray-200">
                            {header}
                        </div>
                    ))}
                </div>
                {leads.map((lead) => (
                    <>
                        <div
                            id={lead.email}
                            key={lead.email}
                            className="grid grid-cols-[150px_1fr_1fr_1fr_1fr_150px] hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => {
                                setExpandedRow(expandedRow === lead.email ? null : lead.email);
                                if (expandedRow !== lead.email) {
                                    document.getElementById(lead.email)?.classList.add('bg-gray-50');
                                    fetchLeadDetails(lead.email);
                                } else {
                                    document.getElementById(lead.email)?.classList.remove('bg-gray-50');
                                }
                            }}
                        >
                            <div className="px-6 py-4 text-left text-sm">{lead.name}</div>
                            <div className="px-6 py-4 text-left text-sm">
                                <a href={`mailto:${lead.email}`} className="text-blue-500 hover:underline">
                                    {lead.email}
                                </a>
                            </div>
                            <div className="px-6 py-4 text-left text-sm">{lead.company_name}</div>
                            <div className="px-6 py-4 text-left text-sm text-blue-500 hover:underline">
                                <a href={`https://${lead.company_domain}`} target="_blank" rel="noopener noreferrer" className="block">
                                    {`${lead.company_domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}`}
                                </a>
                            </div>
                            <div className="px-6 py-4 text-left text-sm">{lead.role}</div>
                            <div className="px-6 py-4 text-left text-sm flex items-center gap-4">
                                <StatusDisplay status={lead.email_status} />
                                <span className="text-xl hover:bg-gray-200 hover:rounded-full">
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger className="w-full h-full p-1 flex items-center justify-center">
                                                {expandedRow === lead.email ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {expandedRow === lead.email ? 'Close' : 'Expand'}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </span>
                            </div>
                        </div>
                        {expandedRow === lead.email && (
                            <div className="col-span-6 bg-gray-50 p-6">
                                <div className="max-w-7xl mx-auto">
                                    <h2 className="text-xl font-semibold mb-6">Full Details & Action</h2>

                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="ml-4 font-semibold text-primary">Loading Details...</p>
                                        </div>
                                    ) : (
                                        <div className={`grid ${lead.email_status.toLowerCase() === 'new' && !emailContent.subject ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className={`text-lg ${lead.email_status === 'Sent' ? 'block' : 'flex flex-row items-center justify-between'}`}>Company Details
                                                        {lead.email_status !== 'Sent' && ((
                                                            <Button id={`generate-email-btn-${lead.email}`}
                                                                onClick={() => generateEmail(lead.email)}
                                                                disabled={isGenerating}
                                                                className="font-medium border-2 border-blue-800/20 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                            >
                                                                {isGenerating ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Generating...
                                                                    </>
                                                                ) : (
                                                                    'Generate Cold Email'
                                                                )}
                                                            </Button>
                                                        ))}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold text-md text-gray-500">Description</h4>
                                                        <p className="mt-1">{leadDetails?.company_info.company_description}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-500">Industry</h4>
                                                            <p>{leadDetails?.company_info.industry}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-500">Company Size</h4>
                                                            <p>{leadDetails?.company_info.company_size}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {(lead.email_status === 'Sent' || emailContent.subject) ? (
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between">
                                                        <CardTitle className="text-lg">Cold Mail</CardTitle>
                                                        {lead.email_status !== 'Sent' && (
                                                            <Button
                                                                onClick={() => sendEmail(lead.email)}
                                                                disabled={isSending}
                                                                className="font-medium border-2 border-green-800/20 bg-green-100 text-green-800 hover:bg-green-200"
                                                            >
                                                                {isSending ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Sending...
                                                                    </>
                                                                ) : (
                                                                    'Send Email'
                                                                )}
                                                            </Button>
                                                        )}
                                                        {leadDetails?.email_status.sender_email && (
                                                            <a href={`mailto:${leadDetails.email_status.sender_email}`}
                                                                target="_blank" className="text-sm rounded-full bg-blue-100 text-blue-700 px-4 py-1 hover:bg-blue-200">{leadDetails.email_status.sender_email}</a>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-500">Subject</h4>
                                                            <Input id={`subject-input-${lead.email}`}
                                                                value={emailContent.subject || leadDetails?.email_status.email_subject}
                                                                onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                                                                disabled={lead.email_status === 'Sent'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-500">Body</h4>
                                                            <Textarea id={`email-input-${lead.email}`}
                                                                value={emailContent.email || leadDetails?.email_status.email_content}
                                                                onChange={(e) => setEmailContent(prev => ({ ...prev, email: e.target.value }))}
                                                                disabled={lead.email_status === 'Sent'}
                                                                rows={8} className="resize-none"
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ) : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ))}
            </div>
        </div>
    );
}
