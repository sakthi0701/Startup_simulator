"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { RoundBreakdown } from '@/lib/types';
import { Currency, formatCurrency } from '@/lib/currency';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundData: RoundBreakdown | null;
  currency: Currency;
}

export default function AuditModal({
  isOpen,
  onClose,
  roundData,
  currency,
}: AuditModalProps) {
  if (!roundData) return null;

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Calculator className="w-6 h-6 text-primary" />
            Calculation Audit: {roundData.roundName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Priced Round Calculations */}
          <Card className="bg-muted/20 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Priced Round Calculations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="bg-background/50 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">1. Price per Share</h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    Formula: Pre-Money Valuation ÷ Pre-Round Shares
                  </div>
                  <div className="font-mono text-sm bg-muted/40 p-3 rounded border">
                    {formatPrice(roundData.pricedRoundSharePrice)} = {formatCurrency(roundData.preMoneyValuation, currency)} ÷ {formatNumber(roundData.preMoneyShares)} shares
                  </div>
                </div>

                <div className="bg-background/50 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">2. New Investor Shares</h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    Formula: Investment Amount ÷ Price per Share
                  </div>
                  <div className="font-mono text-sm bg-muted/40 p-3 rounded border">
                    {formatNumber(roundData.capitalRaised / roundData.pricedRoundSharePrice)} shares = {formatCurrency(roundData.capitalRaised, currency)} ÷ {formatPrice(roundData.pricedRoundSharePrice)}
                  </div>
                </div>

                <div className="bg-background/50 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">3. Post-Round Total Shares</h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    Formula: Pre-Round Shares + New Investor Shares
                  </div>
                  <div className="font-mono text-sm bg-muted/40 p-3 rounded border">
                    {formatNumber(roundData.ownershipAfter.reduce((sum, o) => sum + o.shares, 0))} shares = {formatNumber(roundData.preMoneyShares)} + {formatNumber(roundData.capitalRaised / roundData.pricedRoundSharePrice)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SAFE Conversion Calculations */}
          {roundData.safeAuditDetails && roundData.safeAuditDetails.length > 0 && (
            <Card className="bg-muted/20 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  SAFE Conversion Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {roundData.safeAuditDetails.map((safe, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 bg-background/30">
                    <h4 className="font-semibold text-foreground mb-4 text-lg">{safe.safeName}</h4>
                    
                    <div className="grid gap-4">
                      {safe.valuationCap && (
                        <div className="bg-background/50 p-3 rounded border border-border">
                          <h5 className="font-medium text-foreground mb-1">Share Price from Valuation Cap</h5>
                          <div className="text-xs text-muted-foreground mb-2">
                            Formula: Valuation Cap ÷ Pre-Money Shares
                          </div>
                          <div className="font-mono text-sm bg-muted/40 p-2 rounded">
                            {formatPrice(safe.priceFromCap!)} = {formatCurrency(safe.valuationCap, currency)} ÷ {formatNumber(roundData.preMoneyShares)} shares
                          </div>
                        </div>
                      )}

                      {safe.discount && (
                        <div className="bg-background/50 p-3 rounded border border-border">
                          <h5 className="font-medium text-foreground mb-1">Share Price from Discount</h5>
                          <div className="text-xs text-muted-foreground mb-2">
                            Formula: Priced Round Share Price × (1 - Discount %)
                          </div>
                          <div className="font-mono text-sm bg-muted/40 p-2 rounded">
                            {formatPrice(safe.priceFromDiscount!)} = {formatPrice(roundData.pricedRoundSharePrice)} × (1 - {safe.discount}%)
                          </div>
                        </div>
                      )}

                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                        <h5 className="font-medium text-foreground mb-1">Final Conversion Price</h5>
                        <div className="text-xs text-muted-foreground mb-2">
                          Formula: min(Priced Round Price, Price from Cap, Price from Discount)
                        </div>
                        <div className="font-mono text-sm bg-muted/40 p-2 rounded">
                          Conversion Price = {formatPrice(safe.finalConversionPrice)}
                        </div>
                      </div>

                      <div className="bg-background/50 p-3 rounded border border-border">
                        <h5 className="font-medium text-foreground mb-1">Shares from SAFE</h5>
                        <div className="text-xs text-muted-foreground mb-2">
                          Formula: SAFE Investment ÷ Final Conversion Price
                        </div>
                        <div className="font-mono text-sm bg-muted/40 p-2 rounded">
                          {formatNumber(safe.sharesFromSafe)} shares = {formatCurrency(safe.amount, currency)} ÷ {formatPrice(safe.finalConversionPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Round Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(roundData.preMoneyValuation, currency)}</div>
                  <div className="text-sm text-muted-foreground">Pre-Money Valuation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{formatCurrency(roundData.capitalRaised, currency)}</div>
                  <div className="text-sm text-muted-foreground">Capital Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatCurrency(roundData.postMoneyValuation, currency)}</div>
                  <div className="text-sm text-muted-foreground">Post-Money Valuation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}