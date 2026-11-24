import React, { useState } from 'react';
import { YouTubeNewsVideo } from '@/lib/news/youtube-news';
import { getTranslation, type Language } from '@/lib/translations';
import { Play, ExternalLink, Tv, Radio, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

interface YouTubeNewsSectionProps {
  videos: YouTubeNewsVideo[];
  locale?: Language;
}

export function YouTubeNewsSection({ videos, locale = 'en' }: YouTubeNewsSectionProps) {
  if (!videos || videos.length === 0) return null;

  const [selectedId, setSelectedId] = useState<string>(videos[0].id);
  const activeVideo = videos.find((v) => v.id === selectedId) || videos[0];

  const t = (key: string, fallback?: string) => getTranslation(locale, key, fallback);

  return (
    <section className="bg-gradient-to-b from-[#0e2722] to-[#0A1D1A] text-white rounded-3xl p-5 sm:p-7 lg:p-9 border border-[#0B3B32]/60 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider font-tabular">
              {t('news.video_eyebrow', 'Daily Live Stream & Result Bulletins')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Tv className="w-6 h-6 text-[#16845B]" />
            <span>{t('news.video_title', 'Kerala Lottery Results Video News')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {t(
              'news.video_subtitle',
              'Watch official live draw telecasts from Gorky Bhavan and daily video bulletins updated everyday at 3:00 PM IST.'
            )}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-[#C8A45D]" />
          <span>Updated Daily at 3:00 PM</span>
        </div>
      </div>

      {/* Main Video Player & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Active Player (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl">
            <iframe
              key={activeVideo.id}
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?rel=0&autoplay=0`}
              title={activeVideo.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* Active Video Meta */}
          <div className="space-y-2.5 bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {activeVideo.isLive ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-600/90 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Live Stream</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#16845B]/90 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  <Sparkles className="w-3 h-3 text-[#C8A45D]" />
                  <span>Official Draw Video</span>
                </span>
              )}

              <span className="text-xs font-bold bg-[#C8A45D]/20 text-[#C8A45D] border border-[#C8A45D]/30 px-2.5 py-0.5 rounded-full font-tabular">
                {activeVideo.schemeName}
              </span>

              {activeVideo.drawCode && (
                <span className="text-xs font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded font-tabular">
                  {activeVideo.drawCode}
                </span>
              )}

              <span className="text-xs text-slate-400 ml-auto">
                {activeVideo.publishedTime}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {activeVideo.title}
            </h3>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{activeVideo.channelTitle}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>

              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#C8A45D] hover:text-[#e4be74] font-semibold transition-colors"
              >
                <span>{t('news.watch_on_youtube', 'Watch on YouTube')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Video Playlist / Grid (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-tabular">
              Recent Draw Broadcasts ({videos.length})
            </h4>
            <span className="text-[11px] text-slate-400">Click to Play</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {videos.map((video) => {
              const isCurrent = video.id === activeVideo.id;
              return (
                <button
                  key={video.id}
                  onClick={() => setSelectedId(video.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex gap-3 items-center group border ${
                    isCurrent
                      ? 'bg-white/15 border-[#C8A45D]/60 shadow-md ring-1 ring-[#C8A45D]/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                  aria-label={`Play ${video.title}`}
                >
                  {/* Thumbnail with play overlay */}
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        isCurrent ? 'bg-[#0B3B32]/70 opacity-100' : 'bg-black/30 group-hover:bg-black/10'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          isCurrent ? 'bg-[#C8A45D] text-[#10201D]' : 'bg-white/80 text-black group-hover:scale-110'
                        } transition-transform shadow-md`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wide truncate">
                        {video.schemeName}
                      </span>
                      {video.drawCode && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {video.drawCode}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium line-clamp-2 leading-snug transition-colors ${
                        isCurrent ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {video.title}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {video.publishedTime}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
