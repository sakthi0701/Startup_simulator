"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator } from 'lucide-react';
import { Currency, formatCurrency } from '@/lib/currency';

interface ExitSimulationProps {
  exitValuation: number;
  currency: Currency;
  isCalculating: boolean;
  onExitValuationChange: (valuation: number) => void;
  onRunSimulation: () => void;
}

export default function ExitSimulation({
  exitValuation,
  currency,
  isCalculating,
  onExitValuationChange,
  onRunSimulation,
}: ExitSimulationProps) {
  return (
    <Card className="bg-card/80 border-border backdrop-blur-md shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3 text-card-foreground">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
            3
          </div>
          Exit Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label={`Exit Valuation (${currency.code})`}
            type="number"
            value={exitValuation}
            onChange={(e) => onExitValuationChange(Number(e.target.value))}
            placeholder="100000000"
          />
          <div className="flex items-end">
            <Button
              onClick={onRunSimulation}
              disabled={isCalculating}
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-xl"
            >
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Run Simulation
                </div>
              )}
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Enter your expected exit valuation to see how much each founder would receive.
        </div>
      </CardContent>
    </Card>
  );
}