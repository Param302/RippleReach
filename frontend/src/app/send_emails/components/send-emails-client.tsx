'use client';

import '@/app/globals.css';
import { useState, useEffect } from "react";
import { API_ENDPOINTS, API_URL } from "@/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, ChevronUp, Loader2, Mail, RefreshCw } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function SendEmailsClient() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [leadDetails, setLeadDetails] = useState<LeadDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [emailContents, setEmailContents] = useState<{[email: string]: {subject: string, email: string}}>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    async function getLeads() {
        const res = await fetch(`${API_URL}${API_ENDPOINTS.sendEmails}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!res.ok) throw new Error('Failed to fetch leads');
        const data = await res.json();
        setLeads(data);
      } 

    const fetchLeadDetails = async (email: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/lead/${email}/details`);
            const data = await response.json();
            setLeadDetails(data);
            if (data.email_status.email_subject && data.email_status.email_content) {
                setEmailContents(prev => ({ ...prev, [email]: { subject: data.email_status.email_subject, email: data.email_status.email_content } }));
            }
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
            console.log(data && data.subject && data.email);
            if (data && data.subject && data.email) {
                console.log('setting email contents');
                const newEmailContents = { ...emailContents };
                newEmailContents[email] = {
                    subject: data.subject,
                    email: data.email
                };
                setEmailContents(newEmailContents);
                console.log(emailContents[email]);
            }
            console.log(emailContents);
            console.log(emailContents[email]);
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
            const subject = emailContents[email]?.subject || leadDetails?.email_status.email_subject;
            const emailBody = emailContents[email]?.email || leadDetails?.email_status.email_content;
            await fetch(`${API_URL}/api/lead/${email}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: subject, email: emailBody }),
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
        setIsDialogOpen(false);
        const newLeads = leads.filter(lead => lead.email_status.toLowerCase() === 'new');
        for (let i = 0; i < newLeads.length; i += 1) {
            const batch = newLeads.slice(i, i + 1);
            await Promise.all(batch.map(async (lead) => {
                lead.email_status = 'Generating';
                // !Handle case where email generation fails
                await generateEmail(lead.email);
                if (emailContents[lead.email] && emailContents[lead.email].subject && emailContents[lead.email].email) {
                    lead.email_status = 'Sending';
                    // await new Promise(resolve => setTimeout(resolve, 5000));
                    await sendEmail(lead.email);
                } else {
                    console.error(`Failed to generate email for ${lead.email}`);
                    lead.email_status = 'Failed';
                }
            }));
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        refreshLeads();
    };

    const refreshLeads = async () => {
        setLeadDetails(null);
        setIsLoading(true);
        await getLeads();
        setIsLoading(false);
    };


    // const autoSendEmails = async () => {
    //     setIsDialogOpen(false);
    //     await Promise.all(leads.map(async (lead) => {
    //         if (lead.email_status.toLowerCase() === 'new') {
    //             lead.email_status = 'Generating';
    //             // !Handle case where email generation fails
    //             await generateEmail(lead.email);
    //             if (emailContents[lead.email] && emailContents[lead.email].subject && emailContents[lead.email].email) {
    //                 lead.email_status = 'Sending';
    //                 // give a pause of 5 seconds
    //                 // await new Promise(resolve => setTimeout(resolve, 5000));
    //                 await sendEmail(lead.email);
    //             } else {
    //                 console.error(`Failed to generate email for ${lead.email}`);
    //                 lead.email_status = 'Failed';
    //             }
    //         }
    //     }));
    //     await new Promise(resolve => setTimeout(resolve, 30000));
    //     window.location.reload();
    //     // window.location.href = window.location.href;
    // };

    const StatusDisplay = ({ status }: { status: string }) => (
        <span className={`px-4 py-1 rounded-full text-xs flex items-center gap-2 ${getStatusColor(status)}`}>
            {(status.toLowerCase() === 'generating' || status.toLowerCase() === 'sending') && (
                <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {status}
        </span>
    );

    return (
        <div key="heading" className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Send Cold Emails</h1>
                <div className="flex gap-2">
                    <Button
                        onClick={refreshLeads}
                        className="text-md font-medium px-4 py-4 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="text-md font-medium px-8 py-4 bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                                disabled={leads.every(lead => lead.email_status.toLowerCase() === 'sent')}
                            >
                                <Mail className="h-5 w-5" />
                                Send Bulk Emails{leads.filter(lead => lead.email_status.toLowerCase() === 'new').length > 0 ? ` (${leads.filter(lead => lead.email_status.toLowerCase() === 'new').length})` : ''}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white max-w-xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Confirm Bulk Email Send
                                </AlertDialogTitle>
                                <div className="space-y-4 pt-2">
                                    <AlertDialogDescription>
                                        You're about to send cold emails to <span className="font-semibold text-gray-900">{leads.filter(lead => lead.email_status.toLowerCase() === 'new').length} recipients</span>. This action will:
                                    </AlertDialogDescription>
                                    
                                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                        <li>Generate personalized emails for each recipient</li>
                                        <li>Automatically send emails once generated</li>
                                        <li>Update status for each lead in real-time</li>
                                    </ul>
                                    
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                        <span className="text-amber-700 text-sm">
                                            ⚠️ This action cannot be undone. Please ensure all lead information is correct before proceeding.
                                        </span>
                                    </div>
                                </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={autoSendEmails}
                                    className="bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                    Confirm Send
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div key="leads-header" className="bg-white rounded-lg shadow relative">
                <div className="grid grid-cols-[150px_1fr_1fr_1fr_200px_200px] bg-gray-100 border-b sticky top-0 rounded-t-lg overflow-hidden">
                    {tableHeaders.map((header) => (
                        <div key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-500 tracking-wider hover:bg-gray-200">
                            {header}
                        </div>
                    ))}
                </div>
                {(leads.length === 0 ? getLeads() : 1) && leads.map((lead) => (
                    <>
                        <div
                            id={lead.email}
                            key={lead.email}
                            className="grid grid-cols-[150px_1fr_1fr_1fr_200px_200px] hover:bg-gray-50 transition-colors cursor-pointer"
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
                            <div className="px-6 py-4 text-sm flex items-center gap-4 justify-between">
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
                                        <div className={`grid ${lead.email_status.toLowerCase() === 'new' && !emailContents[lead.email] ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
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

                                            {(lead.email_status === 'Sent' || emailContents[lead.email]?.subject) ? (
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
                                                        {leadDetails?.email_status.sender_email && emailContents[lead.email]?.subject && (
                                                            <a href={`mailto:${leadDetails.email_status.sender_email}`}
                                                                target="_blank" className="text-sm rounded-full bg-blue-100 text-blue-700 px-4 py-1 hover:bg-blue-200">{leadDetails.email_status.sender_email}</a>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-500">Subject</h4>
                                                            <Input id={`subject-input-${lead.email}`}
                                                                value={emailContents[lead.email]?.subject}
                                                                onChange={(e) => setEmailContents(prev => ({ ...prev, [lead.email]: { ...prev[lead.email], subject: e.target.value } }))}
                                                                disabled={lead.email_status === 'Sent'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-gray-500">Body</h4>
                                                            <Textarea id={`email-input-${lead.email}`}
                                                                value={emailContents[lead.email]?.email}
                                                                onChange={(e) => setEmailContents(prev => ({ ...prev, [lead.email]: { ...prev[lead.email], email: e.target.value } }))}
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
