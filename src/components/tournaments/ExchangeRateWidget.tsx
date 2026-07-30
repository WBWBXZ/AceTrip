'use client';

import { useEffect, useState } from 'react';

interface ExchangeRateResponse {
  result: string;
  rates: Record<string, number>;
}

interface RateInfo {
  currency: string;
  rate: number;
  symbol: string;
}

const COUNTRY_TO_CURRENCY: Record<string, { code: string; symbol: string }> = {
  USA: { code: 'USD', symbol: '$' },
  GBR: { code: 'GBP', symbol: '£' },
  FRA: { code: 'EUR', symbol: '€' },
  ESP: { code: 'EUR', symbol: '€' },
  ITA: { code: 'EUR', symbol: '€' },
  GER: { code: 'EUR', symbol: '€' },
  JPN: { code: 'JPY', symbol: '¥' },
  AUS: { code: 'AUD', symbol: 'A$' },
  CAN: { code: 'CAD', symbol: 'C$' },
  UAE: { code: 'AED', symbol: 'د.إ' },
  QAT: { code: 'QAR', symbol: 'ر.ق' },
  KOR: { code: 'KRW', symbol: '₩' },
  SGP: { code: 'SGD', symbol: 'S$' },
  MEX: { code: 'MXN', symbol: 'MX$' },
  CZE: { code: 'CZK', symbol: 'Kč' },
  AUT: { code: 'EUR', symbol: '€' },
  MAR: { code: 'MAD', symbol: 'د.م.' },
  BRA: { code: 'BRL', symbol: 'R$' },
  HKG: { code: 'HKD', symbol: 'HK$' },
};

interface Props {
  country: string;
}

export function ExchangeRateWidget({ country }: Props) {
  const [rateInfo, setRateInfo] = useState<RateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const currencyInfo = COUNTRY_TO_CURRENCY[country];

  useEffect(() => {
    if (!currencyInfo) {
      setLoading(false);
      return;
    }

    fetch('https://open.er-api.com/v6/latest/CNY')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<ExchangeRateResponse>;
      })
      .then((data) => {
        if (data.result !== 'success') throw new Error('API error');
        const rate = data.rates[currencyInfo.code];
        if (!rate) throw new Error('Currency not found');
        setRateInfo({
          currency: currencyInfo.code,
          rate: Math.round(rate * 10000) / 10000,
          symbol: currencyInfo.symbol,
        });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [country, currencyInfo]);

  if (!currencyInfo) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/40 border border-black/[0.04] h-full">
      <span className="text-xl flex-shrink-0 mt-0.5">💱</span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">汇率参考</h3>
        {loading && (
          <div className="h-3 w-28 rounded bg-black/10 animate-pulse mt-2" />
        )}
        {error && !loading && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">暂无汇率数据</p>
        )}
        {rateInfo && !loading && (
          <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed space-y-0.5">
            <p>
              1 人民币 ≈{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {rateInfo.symbol}
                {rateInfo.currency === 'JPY' || rateInfo.currency === 'KRW'
                  ? rateInfo.rate.toFixed(2)
                  : rateInfo.rate.toFixed(4)}
              </span>{' '}
              {rateInfo.currency}
            </p>
            <p>
              1 {rateInfo.currency} ≈{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                ¥{(1 / rateInfo.rate).toFixed(
                  rateInfo.currency === 'JPY' || rateInfo.currency === 'KRW' ? 4 : 2
                )}
              </span>{' '}
              CNY
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
