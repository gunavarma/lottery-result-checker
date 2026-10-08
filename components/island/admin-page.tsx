import React, { useState, useEffect, useCallback } from 'react';
import { withProviders } from '@/components/with-providers';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Save,
  X,
  Database,
  Calendar,
  Clock,
  Hash,
  Trophy,
  FileText,
} from 'lucide-react';

export const AdminPageIsland = withProviders(AdminPage);

export default function AdminPage() {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [selectedLotteryId, setSelectedLotteryId] = useState('');
  const [drawNumber, setDrawNumber] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('3:00 PM');
  const [sourceUrl, setSourceUrl] = useState('');
  const [verificationLevel, setVerificationLevel] = useState('OFFICIAL');
  const [prizes, setPrizes] = useState<any[]>([
    { category: '1st Prize', description: '', amount: '', orderIndex: 0, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
    { category: '2nd Prize', description: '', amount: '', orderIndex: 1, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
    { category: '3rd Prize', description: '', amount: '', orderIndex: 2, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
    { category: 'Consolation Prize', description: '', amount: '', orderIndex: 3, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lotRes, drawsRes] = await Promise.all([
        fetch('/api/admin/lotteries'),
        fetch('/api/admin/draws'),
      ]);

      if (lotRes.ok) {
        const lotData = await lotRes.json();
        setLotteries(lotData.lotteries || []);
        if (lotData.lotteries?.length > 0 && !selectedLotteryId) {
          setSelectedLotteryId(lotData.lotteries[0].id);
        }
      }

      if (drawsRes.ok) {
        const dData = await drawsRes.json();
        setDraws((dData.draws || []).map((d: any) => ({
          id: d.id,
          drawNumber: d.drawNumber,
          drawDate: d.drawDate?.split('T')[0] || '',
          lottery: d.lottery,
          status: d.status,
          prizeCount: d.prizes?.length || 0,
          numberCount: d.prizes?.reduce((sum: number, p: any) => sum + (p.winningNumbers?.length || 0), 0) || 0,
        })));
      }
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedLotteryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addPrizeTier = () => {
    const idx = prizes.length;
    setPrizes([
      ...prizes,
      { category: '', description: '', amount: '', orderIndex: idx, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
    ]);
  };

  const removePrizeTier = (index: number) => {
    if (prizes.length <= 1) return;
    setPrizes(prizes.filter((_, i) => i !== index).map((p, i) => ({ ...p, orderIndex: i })));
  };

  const addWinningNumber = (prizeIndex: number) => {
    setPrizes(prizes.map((p, i) => {
      if (i !== prizeIndex) return p;
      return { ...p, numbers: [...p.numbers, { series: '', number: '', displayNumber: '', location: '' }] };
    }));
  };

  const removeWinningNumber = (prizeIndex: number, numIndex: number) => {
    setPrizes(prizes.map((p, i) => {
      if (i !== prizeIndex) return p;
      return { ...p, numbers: p.numbers.filter((_, j) => j !== numIndex) };
    }));
  };

  const updateWinningNumber = (prizeIndex: number, numIndex: number, field: string, value: string) => {
    setPrizes(prizes.map((p, i) => {
      if (i !== prizeIndex) return p;
      const updated = [...p.numbers];
      updated[numIndex] = { ...updated[numIndex], [field]: value };
      if (field !== 'displayNumber' && !updated[numIndex].displayNumber && updated[numIndex].series && updated[numIndex].number) {
        updated[numIndex].displayNumber = `${updated[numIndex].series} ${updated[numIndex].number}`;
      }
      return { ...p, numbers: updated };
    }));
  };

  const updatePrize = (index: number, field: string, value: string | number) => {
    setPrizes(prizes.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const selectedLottery = lotteries.find((l) => l.id === selectedLotteryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedLotteryId) {
      setMessage({ type: 'error', text: 'Please select a lottery scheme.' });
      return;
    }
    if (!drawNumber.trim()) {
      setMessage({ type: 'error', text: 'Please enter a draw number (e.g., KN-638).' });
      return;
    }
    if (!drawDate) {
      setMessage({ type: 'error', text: 'Please select a draw date.' });
      return;
    }

    const validPrizes = prizes.filter((p) => p.category.trim() && p.amount.trim());
    if (validPrizes.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one prize tier.' });
      return;
    }

    for (const prize of validPrizes) {
      const validNumbers = prize.numbers.filter((n: any) => n.displayNumber.trim());
      if (validNumbers.length === 0) {
        setMessage({ type: 'error', text: `Please add winning numbers to "${prize.category}".` });
        return;
      }
    }

    setSaving(true);
    try {
      const body: any = {
        lotteryId: selectedLotteryId,
        drawNumber: drawNumber.trim(),
        drawDate,
        drawTime: drawTime || '3:00 PM',
        sourceUrl: sourceUrl.trim() || undefined,
        verificationLevel,
        prizes: validPrizes.map((p: any) => ({
          category: p.category.trim(),
          description: p.description.trim() || undefined,
          amount: parseInt(p.amount.trim(), 10),
          orderIndex: p.orderIndex,
          numbers: p.numbers
            .filter((n: any) => n.displayNumber.trim())
            .map((n: any) => ({
              series: n.series.trim() || undefined,
              number: n.number.trim() || undefined,
              displayNumber: n.displayNumber.trim(),
              location: n.location.trim() || undefined,
            })),
        })),
      };

      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Result ${drawNumber} published successfully! ${data.draw.prizes?.length || 0} prize tiers with ${data.draw.prizes?.reduce((s: number, p: any) => s + (p.winningNumbers?.length || 0), 0) || 0} winning numbers.` });
        setDrawNumber('');
        setDrawDate('');
        setSourceUrl('');
        setPrizes([
          { category: '1st Prize', description: '', amount: '', orderIndex: 0, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
          { category: '2nd Prize', description: '', amount: '', orderIndex: 1, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
          { category: '3rd Prize', description: '', amount: '', orderIndex: 2, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
          { category: 'Consolation Prize', description: '', amount: '', orderIndex: 3, numbers: [{ series: '', number: '', displayNumber: '', location: '' }] },
        ]);
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create result.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error saving result.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Admin Panel' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
        <div>
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Administrator Tools
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] mt-1 tracking-tight">
            Manual Result Entry
          </h1>
          <p className="text-xs sm:text-sm text-[#68736E] mt-1">
            Manually publish lottery results when automated ingestion fails or for correction.
          </p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-[#16845B]/10 text-[#16845B] border-[#16845B]/20'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="block font-bold">{message.type === 'success' ? 'Success' : 'Error'}</strong>
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto p-1 hover:bg-black/5 rounded-lg"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 border-b border-[#E2E7E3]">
        <button
          onClick={() => setActiveTab('entry')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'entry'
              ? 'border-[#0B3B32] text-[#0B3B32]'
              : 'border-transparent text-[#68736E] hover:text-[#17201D]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          New Result Entry
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-[#0B3B32] text-[#0B3B32]'
              : 'border-transparent text-[#68736E] hover:text-[#17201D]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Recent Draws
          {draws.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-[#0B3B32] text-white text-[10px] rounded-full font-tabular">
              {draws.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'entry' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Entry Form */}
          <div className="xl:col-span-2 space-y-6">
            {/* Lottery Selection */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-[#17201D] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0B3B32]" />
                <span>Lottery Scheme</span>
              </h2>
              <select
                value={selectedLotteryId}
                onChange={(e) => setSelectedLotteryId(e.target.value)}
                className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-4 py-3 text-sm text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32] font-medium"
              >
                {lotteries.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code}) — {l.drawDay} {l.isBumper ? '• Bumper' : ''}
                  </option>
                ))}
              </select>
              {selectedLottery && (
                <div className="flex gap-4 text-xs text-[#68736E] font-medium">
                  <span>Ticket: ₹{selectedLottery.ticketPrice}</span>
                  <span>Draw: {selectedLottery.drawDay}</span>
                  <span>Time: {selectedLottery.drawTime}</span>
                </div>
              )}
            </div>

            {/* Draw Details */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-[#17201D] flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#0B3B32]" />
                <span>Draw Identification</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#17201D] text-xs block">Draw Number</label>
                  <input
                    type="text"
                    placeholder={selectedLottery ? `${selectedLottery.code}-XXX` : 'e.g. KN-638, SS-534'}
                    value={drawNumber}
                    onChange={(e) => setDrawNumber(e.target.value.toUpperCase())}
                    className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32] uppercase tracking-wider"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#17201D] text-xs block">Draw Date</label>
                  <input
                    type="date"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#17201D] text-xs block">Draw Time</label>
                  <input
                    type="text"
                    placeholder="3:00 PM"
                    value={drawTime}
                    onChange={(e) => setDrawTime(e.target.value)}
                    className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#17201D] text-xs block">Source URL</label>
                  <input
                    type="url"
                    placeholder="https://official-source.gov.in/..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                  />
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-2 bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2 cursor-pointer hover:bg-[#F1F4F2] transition-colors">
                  <input
                    type="radio"
                    name="verification"
                    value="OFFICIAL"
                    checked={verificationLevel === 'OFFICIAL'}
                    onChange={() => setVerificationLevel('OFFICIAL')}
                    className="accent-[#0B3B32]"
                  />
                  <span className="font-bold text-[#17201D]">OFFICIAL</span>
                  <span className="text-[#68736E] text-[10px]">Certified draw</span>
                </label>
                <label className="flex items-center gap-2 bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2 cursor-pointer hover:bg-[#F1F4F2] transition-colors">
                  <input
                    type="radio"
                    name="verification"
                    value="PROVISIONAL"
                    checked={verificationLevel === 'PROVISIONAL'}
                    onChange={() => setVerificationLevel('PROVISIONAL')}
                    className="accent-[#0B3B32]"
                  />
                  <span className="font-bold text-[#17201D]">PROVISIONAL</span>
                  <span className="text-[#68736E] text-[10px]">Pending confirmation</span>
                </label>
              </div>
            </div>

            {/* Prize Tiers */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#17201D] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#C8A45D]" />
                  <span>Prize Tiers & Winning Numbers</span>
                </h2>
                <button
                  onClick={addPrizeTier}
                  disabled={prizes.length >= 10}
                  className="p-2 rounded-xl bg-[#0B3B32] text-white hover:bg-[#10201D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Add prize tier"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {prizes.map((prize, prizeIdx) => (
                  <div
                    key={prizeIdx}
                    className={`border rounded-2xl p-4 transition-colors ${
                      prize.category.trim()
                        ? 'border-[#E2E7E3] bg-[#F7F7F4]'
                        : 'border-dashed border-[#C5C9C3] bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-tabular font-bold text-[#68736E] uppercase">
                        Tier {prizeIdx + 1}
                      </span>
                      {prizes.length > 1 && (
                        <button
                          onClick={() => removePrizeTier(prizeIdx)}
                          className="p-1.5 rounded-lg text-[#68736E] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                          disabled={prizes.length <= 1}
                          aria-label="Remove tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#17201D] text-[10px] block">Category</label>
                        <input
                          type="text"
                          placeholder="1st Prize"
                          value={prize.category}
                          onChange={(e) => updatePrize(prizeIdx, 'category', e.target.value)}
                          className="w-full bg-white border border-[#E2E7E3] rounded-xl px-3 py-2 text-xs text-[#17201D] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#17201D] text-[10px] block">Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="70,00,000"
                          value={prize.amount}
                          onChange={(e) => updatePrize(prizeIdx, 'amount', e.target.value)}
                          className="w-full bg-white border border-[#E2E7E3] rounded-xl px-3 py-2 text-xs text-[#17201D] font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#17201D] text-[10px] block">Description</label>
                        <input
                          type="text"
                          placeholder="FOR TICKETS ENDING WITH..."
                          value={prize.description}
                          onChange={(e) => updatePrize(prizeIdx, 'description', e.target.value)}
                          className="w-full bg-white border border-[#E2E7E3] rounded-xl px-3 py-2 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                        />
                      </div>
                    </div>

                    {/* Winning Numbers */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#68736E] uppercase tracking-wider">
                          Winning Numbers
                        </span>
                        <button
                          onClick={() => addWinningNumber(prizeIdx)}
                          className="text-[10px] font-bold text-[#0B3B32] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add number
                        </button>
                      </div>

                      <div className="space-y-2">
                        {prize.numbers.map((num: any, numIdx: number) => (
                          <div
                            key={numIdx}
                            className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#E2E7E3] text-xs"
                          >
                            <input
                              type="text"
                              placeholder="PS"
                              maxLength={3}
                              value={num.series}
                              onChange={(e) => updateWinningNumber(prizeIdx, numIdx, 'series', e.target.value.toUpperCase())}
                              className="w-14 bg-transparent border-none text-[#17201D] font-mono font-bold text-center focus:outline-hidden focus:ring-0 uppercase"
                            />
                            <span className="text-[#68736E] shrink-0">+</span>
                            <input
                              type="text"
                              placeholder="6 digits"
                              maxLength={6}
                              value={num.number}
                              onChange={(e) => updateWinningNumber(prizeIdx, numIdx, 'number', e.target.value)}
                              className="w-20 bg-transparent border-none text-[#17201D] font-mono font-bold tracking-wider focus:outline-hidden focus:ring-0"
                            />
                            <span className="text-[#68736E] text-[10px]">→</span>
                            <input
                              type="text"
                              placeholder="PS 320327"
                              value={num.displayNumber}
                              onChange={(e) => updateWinningNumber(prizeIdx, numIdx, 'displayNumber', e.target.value)}
                              className="flex-1 bg-[#F7F7F4] border border-[#E2E7E3] rounded-lg px-2.5 py-1.5 text-[#17201D] font-mono font-bold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                            />
                            <button
                              onClick={() => removeWinningNumber(prizeIdx, numIdx)}
                              className="p-1.5 rounded-lg text-[#68736E] hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label="Remove number"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#0B3B32] hover:bg-[#10201D] disabled:bg-[#68736E] text-white py-3.5 rounded-2xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 font-tabular"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Publish Result</span>
                </>
              )}
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-[#17201D] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8A45D]" />
                Entry Guide
              </h2>
              <div className="space-y-3 text-xs text-[#68736E]">
                <div className="flex gap-3">
                  <span className="text-[#0B3B32] font-bold shrink-0 mt-0.5">1.</span>
                  <p>Select the lottery scheme from the dropdown.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#0B3B32] font-bold shrink-0 mt-0.5">2.</span>
                  <p>Enter the draw number in the format <code className="bg-[#F7F7F4] px-1 rounded text-[10px] font-mono">CODE-NNN</code>.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#0B3B32] font-bold shrink-0 mt-0.5">3.</span>
                  <p>Set the official draw date and time.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#0B3B32] font-bold shrink-0 mt-0.5">4.</span>
                  <p>Add each prize tier with its amount and winning numbers.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#0B3B32] font-bold shrink-0 mt-0.5">5.</span>
                  <p>Click <strong>Publish Result</strong> to save to the database.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F7F7F4] rounded-3xl p-6 border border-[#E2E7E3] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#68736E]">
                <Clock className="w-3.5 h-3.5 text-[#C8A45D]" />
                <span className="font-bold text-[#17201D]">Verification Levels</span>
              </div>
              <p className="text-[#68736E] leading-relaxed">
                <strong>OFFICIAL</strong> — Results are treated as certified and take priority over any pending provisional entries.
              </p>
              <p className="text-[#68736E] leading-relaxed">
                <strong>PROVISIONAL</strong> — Awaiting gazette confirmation. Provisional entries never overwrite an existing OFFICIAL record.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
            <h2 className="text-xl font-extrabold text-[#17201D]">Recent Draw Records</h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F7F7F4] text-[#17201D] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0B3B32]' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0B3B32] mx-auto" />
              <p className="text-xs text-[#68736E]">Loading draw records...</p>
            </div>
          ) : draws.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto">
                <Database className="w-6 h-6 text-[#C8A45D]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#17201D]">No Draw Records</h3>
                <p className="text-xs text-[#68736E] max-w-sm mx-auto">
                  When you publish results manually, they will appear here for review.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('entry')}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#0B3B32] text-white text-xs font-bold hover:bg-[#10201D] transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1.5" />
                Enter New Result
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {draws.map((d: any) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B3B32]/30 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]">
                          {d.lottery?.code}
                        </span>
                        <span className="text-sm font-bold text-[#17201D]">{d.lottery?.name}</span>
                      </div>
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="text-lg font-black font-mono tracking-wider text-[#17201D]">
                          {d.drawNumber}
                        </span>
                        <span className="text-[#68736E] text-xs">—</span>
                        <span className="text-xs text-[#68736E] font-medium">
                          {d.drawDate && new Date(d.drawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#68736E]">
                        <span className="font-tabular">{d.prizeCount} prize tiers</span>
                        <span className="font-tabular">{d.numberCount} winning numbers</span>
                        <span className={`px-2 py-0.5 rounded-full font-tabular ${
                          d.status === 'PUBLISHED' ? 'bg-[#16845B]/10 text-[#16845B]' : 'bg-[#F7F7F4] text-[#68736E]'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#68736E] mt-1 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setActiveTab('entry')}
            className="w-full py-3.5 rounded-2xl bg-[#0B3B32] text-white text-sm font-bold hover:bg-[#10201D] transition-colors flex items-center justify-center gap-2 font-tabular"
          >
            <Plus className="w-4 h-4" />
            Enter New Result
          </button>
        </div>
      )}
    </div>
  );
}
