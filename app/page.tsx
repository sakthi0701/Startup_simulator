"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { TrendingUp, AlertTriangle, Share2, Loader2 } from "lucide-react";
import ResultsDisplay from "../components/ResultsDisplay";
import InitialSetupForm from "../components/InitialSetupForm";
import FundingRoundsList from "../components/FundingRoundsList";
import ExitSimulation from "../components/ExitSimulation";
import CurrencySelector from "../components/CurrencySelector";
import AuditModal from "../components/AuditModal";
import { calculateCapTable } from "../lib/engine";
import { Currency, CURRENCIES } from "../lib/currency";
import { saveScenario } from "../lib/supabase";
import {
  Founder,
  Round,
  ScenarioInput,
  CalculationResponse,
  RoundBreakdown,
} from "../lib/types";

export default function StartupValueSimulator() {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[1]); // Default to USD
  const [founders, setFounders] = useState<Founder[]>([
    { id: crypto.randomUUID(), name: "Mark (CEO)", equityPercent: 60 },
    { id: crypto.randomUUID(), name: "Eduardo (CTO)", equityPercent: 30 },
  ]);
  const [initialShares, setInitialShares] = useState<number>(10_000_000);
  const [initialEsopPoolPercent, setInitialEsopPoolPercent] =
    useState<number>(10);
  const [rounds, setRounds] = useState<Round[]>([
    {
      id: crypto.randomUUID(),
      name: "Seed",
      preMoneyValuation: 5_000_000,
      capitalRaised: 1_000_000,
      safes: [
        {
          id: crypto.randomUUID(),
          name: "Angel SAFE",
          amount: 250_000,
          valuationCap: 4_000_000,
          discount: 20,
        },
      ],
      esopTopUp: { percentage: 12, isPreMoney: true },
    },
  ]);
  const [exitValuation, setExitValuation] = useState<number>(100_000_000);
  const [results, setResults] = useState<CalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedRoundForAudit, setSelectedRoundForAudit] = useState<RoundBreakdown | null>(null);

  // Load shared scenario from localStorage if available
  useEffect(() => {
    const sharedScenario = localStorage.getItem('sharedScenario');
    if (sharedScenario) {
      try {
        const data = JSON.parse(sharedScenario);
        setFounders(data.founders || founders);
        setInitialShares(data.initialShares || initialShares);
        setInitialEsopPoolPercent(data.initialEsopPoolPercent || initialEsopPoolPercent);
        setRounds(data.rounds || rounds);
        setExitValuation(data.exitValuation || exitValuation);
        
        // Set currency if available
        if (data.currency) {
          const savedCurrency = CURRENCIES.find(c => c.code === data.currency);
          if (savedCurrency) {
            setCurrency(savedCurrency);
          }
        }
        
        // Clear the shared scenario from localStorage
        localStorage.removeItem('sharedScenario');
        
        toast.success('Shared scenario loaded successfully! 🎉');
      } catch (err) {
        console.error('Failed to parse shared scenario:', err);
        localStorage.removeItem('sharedScenario');
      }
    }
  }, []);

  // Auto calculate on changes
  useEffect(() => {
    const input: ScenarioInput = {
      founders,
      initialShares,
      initialEsopPoolPercent,
      rounds,
      exitValuation,
    };
    const res = calculateCapTable(input);
    if (res.error) {
      setError(res.error);
      setResults(null);
    } else {
      setError(null);
      setResults(res);
      setWarnings(res.warnings || null);
    }
  }, [founders, initialShares, initialEsopPoolPercent, rounds, exitValuation]);

  const handleRunSimulation = () => {
    setIsCalculating(true);
    toast.success("Simulation Updated 🚀");
    setTimeout(() => {
      const input: ScenarioInput = {
        founders,
        initialShares,
        initialEsopPoolPercent,
        rounds,
        exitValuation,
      };
      const res = calculateCapTable(input);
      if (res.error) {
        setError(res.error);
        setResults(null);
      } else {
        setError(null);
        setResults(res);
        setWarnings(res.warnings || null);
      }
      setIsCalculating(false);
    }, 500);
  };

  const foundersOrder = useMemo(() => founders.map((f) => f.name), [founders]);

  const handleShareScenario = async () => {
    setIsSharing(true);
    try {
      const scenarioData = {
        founders,
        initialShares,
        initialEsopPoolPercent,
        rounds,
        exitValuation,
        currency: currency.code,
      };

      const savedScenario = await saveScenario(scenarioData);
      const shareUrl = `https://startupvaluesimulator.netlify.app/s/${savedScenario.id}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard! 📋');
    } catch (err) {
      console.error('Failed to share scenario:', err);
      toast.error('Failed to generate share link. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleAuditRound = (roundId: string) => {
    if (!results?.breakdown) return;
    
    const roundData = results.breakdown.find(r => 
      rounds.find(round => round.id === roundId)?.name === r.roundName
    );
    
    if (roundData) {
      setSelectedRoundForAudit(roundData);
      setAuditModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0f0f0f] text-foreground">
      <Toaster richColors theme="dark" />
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-9 h-9 text-primary" />
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Startup Value Simulator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Model your startup funding rounds and calculate founder ownership at
            exit with clarity.
          </p>
          <div className="mt-6 flex justify-center items-center gap-4">
            <CurrencySelector
              selectedCurrency={currency}
              onCurrencyChange={setCurrency}
            />
            <Button
              onClick={handleShareScenario}
              disabled={isSharing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg rounded-xl"
            >
              {isSharing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating link...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Scenario
                </div>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            <InitialSetupForm
              founders={founders}
              initialShares={initialShares}
              initialEsopPoolPercent={initialEsopPoolPercent}
              onFoundersChange={setFounders}
              onInitialSharesChange={setInitialShares}
              onInitialEsopPoolPercentChange={setInitialEsopPoolPercent}
            />

            <FundingRoundsList
              rounds={rounds}
              founders={founders}
              onRoundsChange={setRounds}
              onAuditRound={handleAuditRound}
            />

            <ExitSimulation
              exitValuation={exitValuation}
              currency={currency}
              isCalculating={isCalculating}
              onExitValuationChange={setExitValuation}
              onRunSimulation={handleRunSimulation}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Error Card */}
            {error && (
              <Card className="bg-destructive/10 border border-destructive/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Error</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Warning Card */}
            {warnings && (
              <Card className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Warning</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-yellow-500 list-disc pl-5 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Results Display */}
            {results && !error && (
                <ResultsDisplay 
                  results={results} 
                  foundersOrder={foundersOrder}
                  currency={currency}
                />
            )}
          </div>
        </div>

        {/* Audit Modal */}
        <AuditModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          roundData={selectedRoundForAudit}
          currency={currency}
        />
      </div>
    </div>
  );
}