'use client';
import { API_URL } from '@/config';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Loader2, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export default function UpdateEmailBox() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [emails, setEmails] = useState<{ email: string; display_name: string; password: string; api_key: string; isEmpty?: boolean; }[]>([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);

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
        const hasEmptyFields = emails.some(emailObj => !emailObj.email || !emailObj.display_name || !emailObj.password || !emailObj.api_key);
        if (hasEmptyFields) {
            console.log("Emails have empty fields!");
            console.log(emails);

            setEmails(prevEmails => 
                prevEmails.map(emailObj => ({
                    ...emailObj,
                    isEmpty: !emailObj.email || !emailObj.display_name || !emailObj.password || !emailObj.api_key // Add a flag for empty fields
                }))
            );

            setIsLoading(false);
            return;
        }
        console.log("Emails are valid!");
        console.log(emails);

        setIsLoading(false);
        try {
            const response = await fetch(`${API_URL}/api/emails/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emails }),
            });
            if (!response.ok) throw new Error('Failed to update emails');
            
            setEmails(prevEmails => 
                prevEmails.map(emailObj => ({
                    ...emailObj,
                    isEmpty: false
                }))
            );

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 5000);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEmail = () => {
        if (newEmail && newDisplayName) {
            const emailExists = emails.some(emailObj => emailObj.email === newEmail);
            if (emailExists) {
                return; // Prevent adding the email
            }
            setEmails((prevEmails) => [
                ...prevEmails,
                {
                    email: newEmail,
                    display_name: newDisplayName,
                    password: '',
                    api_key: '',
                }
            ]);
            setNewEmail('');
            setNewDisplayName('');
            setIsPopupOpen(false);
        }
    };

    const handleDelete = async (email: string) => {
        console.log("Email to delete:", email);
        console.log("Emails:", emails);
        const updatedEmails = emails.filter(e => e.email !== email);
        setEmails(updatedEmails);
        console.log("Updated emails:", updatedEmails);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl text-center font-bold mb-6 text-gray-800">Setup Email Accounts</h2>
            {showSuccess && (
                <div className="mb-6 p-4 flex flex-col gap-2 items-center justify-center bg-green-50 border border-green-200 rounded-md">
                    <span className="font-semibold">Email Configurations Updated!</span> 
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
            
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                <Button 
                    className="self-end bg-black/80 text-gray-100 hover:bg-black flex items-center gap-2 mb-4"
                    onClick={(e) => {e.preventDefault(); setIsPopupOpen(true);}}
                >
                    <Plus className="h-4 w-4" />
                    Add New Credentials
                </Button>
                {isPopupOpen && (
                    <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                        <DialogContent className="bg-white rounded-lg shadow-xl border border-gray-100 p-10 max-w-md mx-auto select-none">
                            <DialogHeader>
                                <DialogTitle className="text-2xl text-center font-semibold text-gray-900 mb-4">Add New Email</DialogTitle>
                                <DialogDescription className="text-gray-600 text-base leading-relaxed">
                                    Enter the display name and email address you want to add
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={newDisplayName}
                                    onChange={(e) => {
                                        e.preventDefault();
                                        setNewDisplayName(e.target.value);
                                    }}
                                    className={`w-full px-4 py-2 text-gray-900 border ${!newDisplayName ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-black/80`}
                                    placeholder="Display Name"
                                    required
                                />
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => {
                                        e.preventDefault();
                                        setNewEmail(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newEmail && validateEmail(newEmail)) {
                                            e.preventDefault();
                                            handleAddEmail();
                                        }
                                    }}
                                    className={`w-full px-4 py-2 text-gray-900 border ${!newEmail || validateEmail(newEmail) ? 'border-gray-200' : 'border-red-500'} rounded-md focus:outline-none focus:ring-2 focus:ring-black/80`}
                                    placeholder="example@domain.com"
                                    required
                                />
                                {newEmail && !validateEmail(newEmail) && (
                                    <div className="text-sm text-red-500">Please enter a valid email address</div>
                                )}
                                {emails.some(emailObj => emailObj.email === newEmail) && (
                                    <div className="text-sm text-red-500">This email already exists.</div>
                                )}
                            </div>
                            <DialogFooter className="flex gap-3 mt-4">
                                <Button 
                                    onClick={(e) => {e.preventDefault(); setIsPopupOpen(false);}} 
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={(e) => {e.preventDefault(); handleAddEmail();}}
                                    className="flex-1 px-4 py-2 bg-black/80 text-gray-100 hover:bg-black rounded-md transition-colors"
                                >
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    )}
                {emails.map((config, index) => (
                    <div 
                        key={index} 
                        className={`space-y-2 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${config.isEmpty ? 'border border-red-500' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setExpandedRow(expandedRow === config.email ? null : config.email);
                            e.currentTarget.classList.add('bg-gray-50');
                        }}
                    >
                        {config.isEmpty && (
                            <div className="text-sm text-red-500">Please fill in all fields</div>
                        )}
                        <div className="flex justify-between items-center p-2">
                            <span className="text-gray-500 font-semibold">
                                {`#${index + 1} ${config.display_name || 'No Display Name'}`} 
                                <span className="ml-10 bg-orange-100 text-orange-800 text-sm font-medium px-4 py-1 rounded-full">
                                    {config.email}
                                </span>
                            </span>
                            <span className="text-xl">
                                {expandedRow === config.email ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </span>
                        </div>
                        {expandedRow === config.email && (
                            <div className="mt-2 p-4 border border-gray-200 rounded-md" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
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
                                                        handleDelete(config.email);
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
                                        <label className="w-32 text-sm font-semibold">Password</label>
                                        <div className="flex-1 relative">
                                            <Input 
                                                type={showPassword ? "text" : "password"}
                                                defaultValue={config.password} 
                                                className="w-full pr-10"
                                                onChange={(e) => {
                                                    config.isEmpty = e.target.value === '';
                                                    e.preventDefault();
                                                    const updatedEmails = emails.map((emailObj) => 
                                                        emailObj.email === config.email 
                                                            ? { ...emailObj, password: e.target.value } 
                                                            : emailObj
                                                    );
                                                    setEmails(updatedEmails);
                                                }}
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
                                                onChange={(e) => {
                                                    config.isEmpty = e.target.value === '';
                                                    e.preventDefault();
                                                    const updatedEmails = emails.map((emailObj) => 
                                                        emailObj.email === config.email 
                                                            ? { ...emailObj, api_key: e.target.value } 
                                                            : emailObj
                                                    );
                                                    setEmails(updatedEmails);
                                                }}
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
                                        <AlertDialogTrigger className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                                            View API key setup guide
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white rounded-lg shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-bold text-gray-900 mb-4">
                                                    Ripple Reach Resend Setup Guide
                                                </AlertDialogTitle>
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <h3 className="font-semibold text-lg text-gray-800">Follow these steps:</h3>
                                                        <ol className="space-y-6">
                                                            <li className="space-y-2">
                                                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-sm">1</div>
                                                                    Create a New Resend Account
                                                                </div>
                                                                <ul className="ml-8 space-y-1 text-gray-600">
                                                                    <li>• Visit <strong>resend.com</strong> and click "Sign Up"</li>
                                                                    <li>• Use the same email as your Ripple Reach account</li>
                                                                    <li>• Complete verification via email</li>
                                                                    <li>• Set up account details and security</li>
                                                                </ul>
                                                            </li>

                                                            <li className="space-y-2">
                                                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-sm">2</div>
                                                                    Connect Your Domain
                                                                </div>
                                                                <div className="ml-8 space-y-3">
                                                                    <details className="group" onClick={(e) => e.currentTarget.toggleAttribute('open')}>
                                                                        <summary className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                                                                            <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
                                                                            <strong>Namecheap Instructions</strong>
                                                                        </summary>
                                                                        <div className="mt-2 ml-6 text-gray-600 space-y-1">
                                                                            <p>• Access <strong>DNS Manager</strong> in Namecheap</p>
                                                                            <p>• Add <strong>TXT record</strong>: @ → (provided by resend)</p>
                                                                            <p>• Add <strong>CNAME</strong>: resend → (provided by resend)</p>
                                                                            <p>• Set <strong>TTL</strong> to 14440 for both</p>
                                                                        </div>
                                                                    </details>

                                                                    <details className="group" onClick={(e) => e.currentTarget.toggleAttribute('open')}>
                                                                        <summary className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                                                                            <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
                                                                            <strong>GoDaddy Instructions</strong>
                                                                        </summary>
                                                                        <div className="mt-2 ml-6 text-gray-600 space-y-1">
                                                                            <p>• Navigate to <strong>Domain Manager</strong></p>
                                                                            <p>• Add <strong>TXT record</strong>: @ → (provided by resend)</p>
                                                                            <p>• Add <strong>CNAME</strong>: resend → (provided by resend)</p>
                                                                            <p>• Set <strong>TTL</strong> to 1 hour</p>
                                                                        </div>
                                                                    </details>
                                                                </div>
                                                            </li>

                                                            <li className="space-y-2">
                                                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-sm">3</div>
                                                                    Generate & Copy API Key
                                                                </div>
                                                                <ul className="ml-8 space-y-1 text-gray-600">
                                                                    <li>• Go to Account Settings → API Keys</li>
                                                                    <li>• Generate a new API key</li>
                                                                    <li>• Copy and store it securely</li>
                                                                </ul>
                                                            </li>
                                                        </ol>
                                                    </div>
                                                </div>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-8">
                                                <AlertDialogAction className="w-full bg-black text-white hover:bg-black/90 transition-colors py-2 rounded-md">
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