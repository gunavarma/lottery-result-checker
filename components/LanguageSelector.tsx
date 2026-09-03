'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '@/lib/translations';

interface LanguageSelectorProps {
  variant?: 'header' | 'compact' | 'drawer' | 'footer';
  className?: string;
}

export function LanguageSelector({ variant = 'header', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentOption, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  // 1. Drawer Variant (for mobile menu)
  if (variant === 'drawer') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#68736E] uppercase tracking-wider px-1">
          <Globe className="w-3.5 h-3.5 text-[#0B3B32]" />
          <span>{t('ui.select_language', 'Select Language')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs'
                    : 'bg-[#F7F7F4] text-[#17201D] hover:bg-[#F1F4F2] border-[#E2E7E3]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.flag}</span>
                  <div className="text-left">
                    <span className="block leading-tight font-bold">{item.nativeName}</span>
                    <span
                      className={`block text-[10px] ${
                        isSelected ? 'text-white/80' : 'text-[#68736E]'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Footer Variant (simple pills)
  if (variant === 'footer') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-[#C8A45D]" />
          <span>{t('ui.change_language', 'Language')}:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  isSelected
                    ? 'bg-[#C8A45D] text-[#10201D]'
                    : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                <span>{item.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Compact Variant (small button for tight headers)
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Select language"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#17201D] hover:text-[#0B3B32] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-[#0B3B32]" />
          <span>{currentOption.shortLabel}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-[#E2E7E3] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            {languages.map((item) => {
              const isSelected = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-[#F1F4F2] text-[#0B3B32] font-bold'
                      : 'text-[#17201D] hover:bg-[#F7F7F4] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.flag}</span>
                    <span>{item.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0B3B32]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 4. Default Header Variant (standard desktop navigation)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Language selector"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#17201D] hover:text-[#0B3B32] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors shadow-2xs"
      >
        <Globe className="w-3.5 h-3.5 text-[#0B3B32]" />
        <span className="text-sm leading-none">{currentOption.flag}</span>
        <span className="hidden sm:inline-block font-semibold">{currentOption.nativeName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#68736E] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E2E7E3] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 pb-1.5 mb-1 border-b border-[#E2E7E3] text-[10px] font-bold text-[#68736E] uppercase tracking-wider">
            {t('ui.select_language', 'Select Language')}
          </div>
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-[#F1F4F2] text-[#0B3B32] font-extrabold'
                    : 'text-[#17201D] hover:bg-[#F7F7F4] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.flag}</span>
                  <div>
                    <span className="block leading-tight font-bold">{item.nativeName}</span>
                    <span className="block text-[10px] text-[#68736E]">{item.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#0B3B32] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
