'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/config';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Eye, EyeOff, AlertTriangle, QuestionMarkCircle } from "lucide-react";
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
    const [showPassword, setShowPassword] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

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
            
            <form onSubmit={handleSubmit} className="space-y-2">
                {emails.map((config, index) => (
                    <div 
                        key={index} 
                        className="space-y-2 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            setExpandedRow(expandedRow === config.email ? null : config.email);
                            e.currentTarget.classList.add('bg-gray-50');
                        }}
                    >
                        <div className="flex justify-between items-center p-2">
                            <span className="text-gray-500 font-semibold">{`#${index + 1} ${config.display_name}`}<span className="ml-10 bg-orange-100 text-orange-800 text-sm font-medium px-4 py-1 rounded-full">{config.email}</span></span>
                            <span className="text-xl">
                                {expandedRow === config.email ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </span>
                        </div>
                        {expandedRow === config.email && (
                            <div className="mt-2 p-4 border border-gray-200 rounded-md" onClick={e => e.stopPropagation()}>
                                <div className="mb-4 flex justify-between items-center">
                                    <h3 className="font-semibold">Details</h3>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="text-red-600 hover:bg-red-100 rounded py-1"><Trash2 className="scale-125"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white rounded-lg shadow-xl border border-gray-100 p-6 max-w-md mx-auto select-none">
                                            <AlertDialogHeader className="space-y-3">
                                                <AlertDialogTitle className="text-2xl font-semibold text-gray-900">
                                                    <div className="flex items-center gap-3">
                                                        <AlertTriangle className="h-6 w-6 text-red-500" />
                                                        Confirm Deletion
                                                    </div>
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-gray-600 text-base leading-relaxed">
                                                    Are you sure you want to delete the credentials for <span className="font-medium text-gray-900">{config.display_name}</span> (<span className="text-blue-600">{config.email}</span>)?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex gap-3 mt-8">
                                                <AlertDialogCancel 
                                                    onClick={() => console.log("NO")}
                                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                                >
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => {
                                                        console.log("YES");
                                                    }}
                                                    className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-sm font-semibold">Display Name</label>
                                        <Input defaultValue={config.display_name} className="flex-1"/>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-sm font-semibold">Email</label>
                                        <Input defaultValue={config.email} className="flex-1"/>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-sm font-semibold">Password</label>
                                        <div className="flex-1 relative">
                                            <Input 
                                                type={showPassword ? "text" : "password"}
                                                defaultValue={config.password} 
                                                className="w-full pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-sm font-semibold flex items-center">
                                            API Key
                                        </label>
                                        <div className="flex-1 relative">
                                            <Input
                                                type={showApiKey ? "text" : "password"}
                                                defaultValue={config.api_key}
                                                className="w-full pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ml-36 -mt-2 pl-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger className="text-sm text-blue-600 hover:underline">
                                                Click here for API key setup guide
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-white rounded-lg shadow-xl border border-gray-100 p-6 max-w-md mx-auto select-none">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-2xl font-bold text-gray-900">
                                                        How to get your API Key
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription className="mt-4 space-y-4">
                                                        <div className="flex flex-col gap-4">
                                                            {[
                                                                `Log in to your email provider's developer console`,
                                                                "Navigate to the API section",
                                                                "Create a new API key with email sending permissions", 
                                                                "Copy the generated API key",
                                                                "Paste it in the API Key field above"
                                                            ].map((step, i) => (
                                                                <div key={i} className="flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                                                                        {i + 1}
                                                                    </div>
                                                                    <div className="text-gray-600">{step}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="mt-6">
                                                    <AlertDialogAction className="w-full bg-black text-white hover:bg-black/90 transition-colors">
                                                        Got it
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
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