'use client';

import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

interface ShareButtonsProps {
    title: string;
    description?: string;
    url?: string;
    type?: string;
}

export default function ShareButtons({ title, description, url, type = 'Share' }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();

    // Use current URL if not provided
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = description ? `${title} - ${description}` : title;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            showToast('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            showToast('Failed to copy link', 'error');
        }
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    };

    const handleFacebookShare = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
    };

    const handleEmailShare = () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        window.location.href = emailUrl;
    };

    return (
        <div className="section bg-slate-700 py-4">
            <div className="container-full">
                <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-medium text-white">{type}:</span>

                    {/* Copy Link Button */}
                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center justify-center w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors"
                        title="Copy link"
                    >
                        {copied ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    {/* X (Twitter) Button */}
                    <button
                        onClick={handleTwitterShare}
                        className="inline-flex items-center justify-center w-9 h-9 bg-black hover:bg-gray-800 text-white rounded-sm transition-colors"
                        title="Share on X"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </button>

                    {/* Facebook Button */}
                    <button
                        onClick={handleFacebookShare}
                        className="inline-flex items-center justify-center w-9 h-9 bg-[#1877F2] hover:bg-[#165dc9] text-white rounded-sm transition-colors"
                        title="Share on Facebook"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </button>

                    {/* Email Button */}
                    <button
                        onClick={handleEmailShare}
                        className="inline-flex items-center justify-center w-9 h-9 bg-gray-800 hover:bg-gray-900 text-white rounded-sm transition-colors"
                        title="Share via email"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

    );
}
