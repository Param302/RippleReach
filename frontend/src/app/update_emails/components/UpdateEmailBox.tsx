'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/config';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react"

export default function UpdateEmailBox() {
    const router = useRouter();
    const [emails, setEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const { toast } = useToast();

    useEffect(() => {
        (async () => {
            try {
                const response = await fetch(`${API_URL}/api/emails`);
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
                    <p><a href="/" className="text-sm text-blue-600 hover:text-blue-800 underline mt-1">
                            Click here
                        </a> if not redirected
                    </p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {emails.map((email, index) => (
                    <div key={index} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Email Account #{index + 1}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                const newEmails = [...emails];
                                newEmails[index] = e.target.value;
                                setEmails(newEmails);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter email address"
                            required
                        />
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