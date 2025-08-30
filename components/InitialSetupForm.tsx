"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Import the Label component
import { Plus, Trash2 } from 'lucide-react';
import { Founder } from '@/lib/types';
import InfoTooltip from './InfoTooltip'; // Import the new tooltip component

interface InitialSetupFormProps {
  founders: Founder[];
  initialShares: number;
  initialEsopPoolPercent: number;
  onFoundersChange: (founders: Founder[]) => void;
  onInitialSharesChange: (shares: number) => void;
  onInitialEsopPoolPercentChange: (percent: number) => void;
}

export default function InitialSetupForm({
  founders,
  initialShares,
  initialEsopPoolPercent,
  onFoundersChange,
  onInitialSharesChange,
  onInitialEsopPoolPercentChange,
}: InitialSetupFormProps) {
  const updateFounder = (id: string, patch: Partial<Founder>) => {
    onFoundersChange(
      founders.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const removeFounder = (id: string) => {
    onFoundersChange(founders.filter((f) => f.id !== id));
  };

  const addFounder = () => {
    const newFounder: Founder = {
      id: crypto.randomUUID(),
      name: `Founder ${founders.length + 1}`,
      equityPercent: 0,
    };
    onFoundersChange([...founders, newFounder]);
  };

  const totalFounderPct = founders.reduce(
    (sum, f) => sum + (Number.isFinite(f.equityPercent) ? f.equityPercent! : 0),
    0
  );
  const totalPct = totalFounderPct + (Number.isFinite(initialEsopPoolPercent) ? initialEsopPoolPercent : 0);
  const equityOk = Math.abs(totalPct - 100) < 0.01;

  return (
    <Card className="bg-card/80 border-border backdrop-blur-md shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3 text-card-foreground">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
            1
          </div>
          Initial Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Initial Shares Input */}
          <div className="space-y-2">
            <Label htmlFor="initialShares">Initial Shares</Label>
            <Input
              id="initialShares"
              type="number"
              value={initialShares}
              onChange={(e) => onInitialSharesChange(Number(e.target.value))}
              className="bg-muted/40 border-border focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          {/* Initial ESOP Pool Input with Tooltip */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="initialEsopPool">Initial ESOP Pool (%)</Label>
              <InfoTooltip text="The Employee Stock Option Pool (ESOP) is a percentage of company shares reserved for future employees." />
            </div>
            <Input
              id="initialEsopPool"
              type="number"
              value={initialEsopPoolPercent}
              onChange={(e) => onInitialEsopPoolPercentChange(Number(e.target.value))}
              className="bg-muted/40 border-border focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Founders</h3>
            <Button
              onClick={addFounder}
              size="sm"
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Founder
            </Button>
          </div>
          <div className="space-y-2">
            {founders.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 p-3 bg-muted/40 hover:bg-muted/60 rounded-lg border border-border transition-colors"
              >
                <Input
                  placeholder="Founder Name"
                  value={f.name}
                  onChange={(e) => updateFounder(f.id, { name: e.target.value })}
                  className="bg-transparent border-0 focus:ring-0"
                />
                <Input
                  type="number"
                  className="w-28"
                  placeholder="Equity %"
                  value={f.equityPercent}
                  onChange={(e) =>
                    updateFounder(f.id, {
                      equityPercent: Number(e.target.value),
                    })
                  }
                />
                <Button
                  onClick={() => removeFounder(f.id)}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div
            className={`text-sm text-right pr-12 pt-2 font-medium ${
              equityOk ? "text-green-500" : "text-destructive"
            }`}
          >
            Total Equity: {totalPct.toFixed(1)}%
            {!equityOk && (
              <span className="block text-xs">Must equal 100%</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}