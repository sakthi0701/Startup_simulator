"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Round, SAFE, Founder, FounderSecondary } from '@/lib/types';
import InfoTooltip from './InfoTooltip';

interface FundingRoundsListProps {
  rounds: Round[];
  founders: Founder[];
  onRoundsChange: (rounds: Round[]) => void;
  onAuditRound?: (roundId: string) => void;
}

export default function FundingRoundsList({
  rounds,
  founders,
  onRoundsChange,
  onAuditRound,
}: FundingRoundsListProps) {
  const addRound = () => {
    const newRound: Round = {
      id: crypto.randomUUID(),
      name: `Series ${String.fromCharCode(65 + rounds.length)}`,
      preMoneyValuation: 10_000_000,
      capitalRaised: 2_000_000,
      safes: [],
      founderSecondary: [],
    };
    onRoundsChange([...rounds, newRound]);
  };

  const updateRound = (id: string, patch: Partial<Round>) => {
    onRoundsChange(
      rounds.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const removeRound = (id: string) => {
    onRoundsChange(rounds.filter((r) => r.id !== id));
  };
  
  const addSecondary = (roundId: string) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;

    const newSecondary: FounderSecondary = {
      id: crypto.randomUUID(),
      founderName: '',
      amount: 0,
    };
    
    const secondaries = round.founderSecondary || [];
    updateRound(roundId, { founderSecondary: [...secondaries, newSecondary] });
  };

  const updateSecondary = (roundId: string, secondaryId: string, patch: Partial<FounderSecondary>) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || !round.founderSecondary) return;
    
    updateRound(roundId, {
      founderSecondary: round.founderSecondary.map(sec =>
        sec.id === secondaryId ? { ...sec, ...patch } : sec
      ),
    });
  };

  const removeSecondary = (roundId: string, secondaryId: string) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || !round.founderSecondary) return;
    
    updateRound(roundId, {
      founderSecondary: round.founderSecondary.filter(sec => sec.id !== secondaryId),
    });
  };


  const addSafe = (roundId: string) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;

    const newSafe: SAFE = {
      id: crypto.randomUUID(),
      name: `SAFE ${round.safes.length + 1}`,
      amount: 100_000,
      discount: 20,
    };

    updateRound(roundId, {
      safes: [...round.safes, newSafe],
    });
  };

  const updateSafe = (roundId: string, safeId: string, patch: Partial<SAFE>) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;

    updateRound(roundId, {
      safes: round.safes.map((s) =>
        s.id === safeId ? { ...s, ...patch } : s
      ),
    });
  };

  const removeSafe = (roundId: string, safeId: string) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;

    updateRound(roundId, {
      safes: round.safes.filter((s) => s.id !== safeId),
    });
  };

  return (
    <Card className="bg-card/80 border-border backdrop-blur-md shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3 text-card-foreground">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
            2
          </div>
          Funding Rounds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {rounds.map((r) => (
          <Card
            key={r.id}
            className="bg-muted/30 border-border p-4 space-y-4 rounded-xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  className="text-lg font-semibold bg-transparent border-0 focus:ring-0 text-foreground"
                  value={r.name}
                  onChange={(e) => updateRound(r.id, { name: e.target.value })}
                />
                {onAuditRound && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAuditRound(r.id)}
                    className="hover:bg-primary/10 rounded-full"
                    title="Audit calculations for this round"
                  >
                    <Calculator className="w-4 h-4 text-primary" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRound(r.id)}
                className="hover:bg-destructive/10 rounded-full"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <div className="flex items-center">
                    <Label htmlFor={`preMoney-${r.id}`}>Pre-Money Valuation</Label>
                    <InfoTooltip text="The value of the company *before* the new investment is added." />
                 </div>
                 <Input
                    id={`preMoney-${r.id}`}
                    type="number"
                    value={r.preMoneyValuation}
                    onChange={(e) =>
                      updateRound(r.id, {
                        preMoneyValuation: Number(e.target.value),
                      })
                    }
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`capitalRaised-${r.id}`}>Capital Raised</Label>
                <Input
                    id={`capitalRaised-${r.id}`}
                    type="number"
                    value={r.capitalRaised}
                    onChange={(e) =>
                      updateRound(r.id, {
                        capitalRaised: Number(e.target.value),
                      })
                    }
                  />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">ESOP Top-up</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`esop-switch-${r.id}`}
                  checked={!!r.esopTopUp}
                  onCheckedChange={(c) =>
                    updateRound(r.id, {
                      esopTopUp: c
                        ? { percentage: 10, isPreMoney: true }
                        : undefined,
                    })
                  }
                />
                <Label htmlFor={`esop-switch-${r.id}`} className="text-foreground">
                  {r.esopTopUp ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
              {r.esopTopUp && (
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Input
                    type="number"
                    value={r.esopTopUp.percentage}
                    onChange={(e) =>
                      updateRound(r.id, {
                        esopTopUp: {
                          ...r.esopTopUp!,
                          percentage: Number(e.target.value),
                        },
                      })
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`premoneyswitch-${r.id}`}
                      checked={r.esopTopUp.isPreMoney}
                      onCheckedChange={(c) =>
                        updateRound(r.id, {
                          esopTopUp: { ...r.esopTopUp!, isPreMoney: c },
                        })
                      }
                    />
                    <Label htmlFor={`premoneyswitch-${r.id}`} className="text-foreground">
                      Pre-money
                    </Label>
                    <InfoTooltip text="'Pre-Money' means the ESOP pool is increased *before* the new investment, diluting only existing shareholders. If off, it's 'Post-Money', diluting new investors too." />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Label className="text-foreground">Founder Secondary</Label>
                  <InfoTooltip text="Allows a founder to sell some of their existing shares to an investor. This money goes to the founder, not the company." />
                </div>
                <Button variant="outline" size="sm" onClick={() => addSecondary(r.id)}>
                  Add Sale
                </Button>
              </div>
              {(r.founderSecondary || []).map(sec => (
                <div key={sec.id} className="grid grid-cols-3 gap-2 items-center">
                  <Select
                    value={sec.founderName}
                    onValueChange={(val) => updateSecondary(r.id, sec.id, { founderName: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Founder" />
                    </SelectTrigger>
                    <SelectContent>
                      {founders.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={sec.amount}
                    onChange={(e) => updateSecondary(r.id, sec.id, { amount: Number(e.target.value) })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeSecondary(r.id, sec.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>


            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Label className="text-foreground">SAFEs</Label>
                  <InfoTooltip text="A Simple Agreement for Future Equity is an investment that converts to equity in a future priced round, often with favorable terms like a valuation cap or discount." />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSafe(r.id)}
                  className="rounded-lg"
                >
                  Add SAFE
                </Button>
              </div>
              {r.safes.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-5 items-center gap-2 p-2 bg-muted/20 rounded border border-border"
                >
                  <div className="space-y-1 col-span-5 sm:col-span-1">
  <Label
    className="text-xs text-muted-foreground"
    htmlFor={`safe-name-${s.id}`}
  >
    SAFE Name
  </Label>
  <Input
    id={`safe-name-${s.id}`}
    placeholder="SAFE Name"
    value={s.name}
    onChange={(e) =>
      updateSafe(r.id, s.id, { name: e.target.value })
    }
  />
</div>

<div className="space-y-1 col-span-2 sm:col-span-1">
  <Label
    className="text-xs text-muted-foreground"
    htmlFor={`safe-amount-${s.id}`}
  >
    Amount
  </Label>
  <Input
    id={`safe-amount-${s.id}`}
    placeholder="Amount"
    type="number"
    value={s.amount}
    onChange={(e) =>
      updateSafe(r.id, s.id, {
        amount: Number(e.target.value),
      })
    }
  />
</div>

                  <div className="col-span-3 sm:col-span-1 space-y-1">
                     <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground" htmlFor={`cap-${s.id}`}>Cap</Label>
                        <InfoTooltip text="The maximum valuation at which the SAFE converts, protecting the investor."/>
                     </div>
                     <Input
                        id={`cap-${s.id}`}
                        placeholder="Cap"
                        type="number"
                        value={s.valuationCap}
                        onChange={(e) =>
                          updateSafe(r.id, s.id, {
                            valuationCap: Number(e.target.value),
                          })
                        }
                      />
                  </div>
                   <div className="col-span-3 sm:col-span-1 space-y-1">
                     <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground" htmlFor={`discount-${s.id}`}>Discount %</Label>
                        <InfoTooltip text="A percentage discount on the future round's share price."/>
                     </div>
                     <Input
                        id={`discount-${s.id}`}
                        placeholder="Discount"
                        type="number"
                        value={s.discount}
                        onChange={(e) =>
                          updateSafe(r.id, s.id, {
                            discount: Number(e.target.value),
                          })
                        }
                      />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSafe(r.id, s.id)}
                    className="hover:bg-destructive/10 rounded-full justify-self-end col-span-2 sm:col-span-1"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
        <Button
          onClick={addRound}
          size="sm"
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Funding Round
        </Button>
      </CardContent>
    </Card>
  );
}