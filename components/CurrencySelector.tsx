"use client";

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Currency, CURRENCIES } from '@/lib/currency';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export default function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
}: CurrencySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Currency:</span>
      <Select
        value={selectedCurrency.code}
        onValueChange={(code) => {
          const currency = CURRENCIES.find(c => c.code === code);
          if (currency) {
            onCurrencyChange(currency);
          }
        }}
      >
        <SelectTrigger className="w-32 bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span>{currency.symbol}</span>
                <span>{currency.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}