'use client';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Lead {
  email: string;
  name: string;
  company_name: string;
  company_domain: string;
  role: string;
  company_size: string;
  email_status: string;
}

export default function SendEmailsClient({ leads }: { leads: Lead[] }) {
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  interface Lead {
    email: string;
    name: string;
    company_name: string;
    company_domain: string;
    role: string;
    company_size: string;
    email_status: string;
  }
  
    const toggleDetails = (email: string) => {
      setOpenDetails(prev => ({
        ...prev,
        [email]: !prev[email]
      }));
    };
  
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Send Cold Emails</h1>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Lead Previews</h2>
          <Button onClick={() => console.log('Auto sending emails')}>
            Auto Send Cold Emails
          </Button>
        </div>
  
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Company Website</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <>
                <TableRow key={lead.email}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.company_name}</TableCell>
                  <TableCell>{lead.company_domain}</TableCell>
                  <TableCell>{lead.role}</TableCell>
                  <TableCell>{lead.company_size}</TableCell>
                  <TableCell id={`status-${lead.email}`}>{lead.email_status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => toggleDetails(lead.email)}
                      >
                        Open Details
                      </Button>
                      <Button 
                        id={`send-email-${lead.email}`}
                        onClick={() => console.log('Sending email to', lead.email)}
                      >
                        Send
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {openDetails[lead.email] && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="p-4 space-y-4">
                        <div id={`details-content-${lead.email}`} />
                        <Button
                          id={`generate-email-${lead.email}`}
                          onClick={() => console.log('Generating email for', lead.email)}
                        >
                          Generate Cold Email
                        </Button>
                        <div id={`email-content-${lead.email}`} className="space-y-2">
                          <Input
                            id={`subject-${lead.email}`}
                            placeholder="Email Subject"
                            className="w-full"
                          />
                          <Textarea
                            id={`body-${lead.email}`}
                            placeholder="Email Body"
                            rows={6}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    );
} 