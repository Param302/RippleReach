'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/config';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function UpdateEmailBox() {
    const router = useRouter();
    const { toast } = useToast();
    const [countdown, setCountdown] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [emails, setEmails] = useState<{ email: string; display_name: string; password: string; api_key: string; }[]>([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const response = await fetch(`${API_URL}/api/emails/details`, { cache: 'no-store' });
                const data = await response.json();
                setEmails(data);
            } catch (error) {
                console.error('Error fetching emails:', error);
            }
        })();
    }, []);

    useEffect(() => {
        if (showSuccess && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [showSuccess, countdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/emails/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emails }),
            });

            if (!response.ok) throw new Error('Failed to update emails');
            
            setShowSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 5000);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update emails. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl text-center font-bold mb-6 text-gray-800">Setup Email Accounts</h2>
            {showSuccess && (
                <div className="mb-6 p-4 flex flex-col gap-2 items-center justify-center bg-green-50 border border-green-200 rounded-md">
                    <span className="font-semibold">Email Updated!</span> 
                    <p className="text-green-800 font-medium text-center">
                        Redirecting to dashboard in {countdown} seconds...
                    </p>
                    <p>
                        <a href="/" className="text-sm text-blue-600 hover:text-blue-800 underline mt-1">
                            Click here
                        </a> if not redirected
                    </p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {emails.map((config, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-semibold">{`#${index + 1} ${config.display_name}`}<span className="ml-10 bg-orange-100 text-orange-800 text-sm font-medium px-4 py-1 rounded-full">{config.email}</span></span>
                            <span 
                                className="text-xl hover:bg-gray-200 hover:rounded-full"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setExpandedRow(expandedRow === config.email ? null : config.email);
                                }}
                            >
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger className="w-full h-full p-1 flex items-center justify-center">
                                            {expandedRow === config.email ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </TooltipTrigger>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                        </div>
                        {expandedRow === config.email && (
                            <div className="mt-2 p-4 border border-gray-200 rounded-md">
                                <h3 className="font-semibold">Details</h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium">Display Name:</label>
                                        <Input value={config.display_name} readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Email:</label>
                                        <Input value={config.email} readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Password:</label>
                                        <Input value={config.password} readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">API Key:</label>
                                        <Input value={config.api_key} readOnly />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="text-red-600">Delete</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the credentials for {config.display_name} ({config.email})?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => console.log("NO")}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => {
                                                    console.log("YES");
                                                    // Add any additional deletion logic here if needed
                                                }}>Confirm</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Important</span><br/> After updating email configurations, make sure to update the corresponding email passwords in the backend environment variables.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 bg-black/80 text-gray-100 font-medium rounded-md hover:bg-black transition-all
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                        </span>
                    ) : (
                        'Update Email Configurations'
                    )}
                </button>
            </form>
        </div>
    );
} 