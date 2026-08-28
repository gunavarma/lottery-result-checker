'use client';

import React, { useState } from 'react';
import { Share2, MessageCircle, Send, Link as LinkIcon, Check } from 'lucide-react';

interface ResultShareBarProps {
  title: string;
  url: string;
}

export function ResultShareBar({ title, url }: ResultShareBarProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${url}`
      : `https://keralalottery.org${url}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: `${title} — Official Kerala State Lotteries winning numbers`,
        url: fullUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${fullUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
      <span className="font-bold text-slate-700 flex items-center gap-1.5">
        <Share2 className="w-4 h-4 text-emerald-700" />
        <span>Share Results:</span>
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram</span>
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs hidden sm:flex"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </a>

        <button
          onClick={handleCopyLink}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
        </button>

        <button
          onClick={handleNativeShare}
          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors sm:hidden"
          title="Share via device"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
