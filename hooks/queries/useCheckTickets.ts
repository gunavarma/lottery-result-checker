'use client';

import { useMutation } from '@tanstack/react-query';

export interface TicketMatchResult {
  inputTicket: string;
  normalizedDisplay: string;
  isMatch: boolean;
  status: 'PRIZE_MATCH' | 'NO_MATCH';
  lotteryName?: string;
  drawNumber?: string;
  drawDate?: string | null;
  prizeCategory?: string;
  prizeAmount?: number;
  prizeAmountFormatted?: string;
  winningNumber?: string;
  location?: string | null;
  resultUrl?: string;
  officialSourceUrl?: string;
  message?: string;
}

export interface CheckTicketsPayload {
  tickets: string[];
  drawId?: string;
  drawNumber?: string;
  lotteryId?: string;
}

export interface CheckTicketsResponse {
  success: boolean;
  drawFound: boolean;
  drawsEvaluated: {
    id: string;
    drawNumber: string;
    lotteryName: string;
    drawDate: string;
  }[];
  results: TicketMatchResult[];
  message?: string;
  error?: string;
}

async function checkTicketsBatch(payload: CheckTicketsPayload): Promise<CheckTicketsResponse> {
  const res = await fetch('/api/tickets/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Server responded with ${res.status}`);
  }
  return json;
}

export function useCheckTickets() {
  return useMutation<CheckTicketsResponse, Error, CheckTicketsPayload>({
    mutationFn: checkTicketsBatch,
  });
}
