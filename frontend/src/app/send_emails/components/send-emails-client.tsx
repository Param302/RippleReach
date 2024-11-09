'use client';

import '@/app/globals.css';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";

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
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function SendEmailsClient({ leads }: { leads: Lead[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Send Cold Emails</h1>
        <Button onClick={() => console.log('Auto sending emails')}>
          Auto Send Cold Emails
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow relative">

        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_150px] bg-gray-100 border-b sticky top-0 rounded-t-lg overflow-hidden">
            {tableHeaders.map((header) => (
                <div key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-500 tracking-wider hover:bg-gray-200">
                    {header}
                </div>
            ))}
        </div>
        {leads.map((lead) => (
            <div key={lead.email} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_150px] hover:bg-gray-50 transition-colors cursor-pointer">
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
                    <span className={`px-4 py-1 rounded-full text-xs ${getStatusColor(lead.email_status)}`}>
                        {lead.email_status}
                    </span>
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
        ))}



        {/* <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <>
                <tr 
                  key={lead.email}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === lead.email ? null : lead.email)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.company_domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.company_size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.email_status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button variant="ghost" size="sm">
                      {expandedRow === lead.email ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </td>
                </tr>
                {expandedRow === lead.email && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="font-medium mb-2">Company Description</h3>
                          <p className="text-gray-600 text-sm">
                            {lead.company_name} is a company focused on...
                          </p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Email Generation</h3>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Generating email for', lead.email);
                              }}
                            >
                              Generate Cold Email
                            </Button>
                          </div>
                          
                          <Input
                            placeholder="Email Subject"
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <Textarea
                            placeholder="Email Body"
                            rows={6}
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <Button 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Sending email to', lead.email);
                            }}
                          >
                            Send Email
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table> */}
      </div>
    </div>
  );
} 