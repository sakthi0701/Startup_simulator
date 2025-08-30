"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, Info } from 'lucide-react';
import { CalculationResponse } from '@/lib/types'; 
import { Currency, formatCurrency, formatPercentage } from '@/lib/currency';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Dynamically import chart components
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });

// Chart.js registration
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
  );
}

interface ResultsDisplayProps {
  results: CalculationResponse;
  foundersOrder: string[];
  currency: Currency;
}

export default function ResultsDisplay({ results, foundersOrder, currency }: ResultsDisplayProps) {
  const totalShares = results.summary.finalOwnership.reduce((sum, s) => sum + s.shares, 0);

  const founderPayouts = foundersOrder.reduce((acc, name) => {
    acc[name] = results.summary.exitPayouts.find(p => p.name === name)?.amount || 0;
    return acc;
  }, {} as Record<string, number>);

  const founderShares = foundersOrder.reduce((acc, name) => {
    acc[name] = results.summary.finalOwnership.find(o => o.name === name)?.shares || 0;
    return acc;
  }, {} as Record<string, number>);

  const foundersOwnershipOverTime = foundersOrder.reduce((acc, name) => {
    acc[name] = results.breakdown.map(round =>
      round.ownershipAfter.find(o => o.name === name)?.percentage || 0
    );
    const initialOwnership = results.breakdown[0]?.ownershipBefore.find(o => o.name === name)?.percentage || 0;
    acc[name].unshift(initialOwnership);
    return acc;
  }, {} as Record<string, number[]>);

  const roundNames = ['Initial', ...results.breakdown.map(r => r.roundName)];

  const doughnutData = {
    labels: foundersOrder.map(
      founder => `${founder} (${formatPercentage((founderShares[founder] / totalShares) * 100)})`
    ),
    datasets: [
      {
        data: foundersOrder.map(founder => founderPayouts[founder]),
        backgroundColor: ['#14b8a6', '#f59e0b', '#818cf8', '#f43f5e', '#38bdf8', '#a3e635'],
        borderColor: '#1F2937',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#F3F4F6',
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6',
        callbacks: {
          label: (context: any) => `${context.label}: ${formatCurrency(context.raw, currency)}`,
        },
      },
    },
  };

  const barData = {
    labels: roundNames,
    datasets: foundersOrder.map((founder, index) => ({
      label: founder,
      data: foundersOwnershipOverTime[founder],
      backgroundColor: ['#14b8a6', '#f59e0b', '#818cf8', '#f43f5e', '#38bdf8', '#a3e635'][index % 6],
      borderRadius: 4,
    })),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#F3F4F6' },
        grid: { color: '#374151' },
        border: { color: '#6B7280' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#F3F4F6',
          callback: (value: any) => `${value}%`,
        },
        grid: { color: '#374151' },
        border: { color: '#6B7280' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#F3F4F6', font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6',
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatPercentage(context.raw)}`,
        },
      },
    },
  };

  const lineData = {
    labels: roundNames,
    datasets: foundersOrder.map((founder, index) => ({
      label: founder,
      data: (foundersOwnershipOverTime[founder] || []).map(
        ownership => (ownership / 100) * (results.summary.exitPayouts.find(p => p.name === founder)?.amount || 0)
      ),
      borderColor: ['#14b8a6', '#f59e0b', '#818cf8', '#f43f5e', '#38bdf8', '#a3e635'][index % 6],
      tension: 0.1,
    })),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { callback: (value: any) => formatCurrency(value, currency), color: '#F3F4F6' },
        grid: { color: '#374151' },
        border: { color: '#6B7280' },
      },
      x: {
        ticks: { color: '#F3F4F6' },
        grid: { color: '#374151' },
        border: { color: '#6B7280' },
      },
    },
    plugins: {
      legend: { labels: { color: '#F3F4F6', font: { size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6',
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw, currency)}`,
        },
      },
    },
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Exit Summary with Table + Chart BELOW */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-card-foreground text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Exit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table */}
          <div className="mb-8">
            <div className="mb-4">
              <p className="text-lg text-foreground">
                Total Exit Value:
                <span className="font-bold text-green-500 ml-2">
                  {formatCurrency(
                    results.summary.exitPayouts.reduce((sum, p) => sum + p.amount, 0),
                    currency
                  )}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Total Shares: {totalShares.toLocaleString()}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-foreground font-semibold">Founder</th>
                    <th className="text-right py-3 text-foreground font-semibold">Shares</th>
                    <th className="text-right py-3 text-foreground font-semibold">Ownership</th>
                    <th className="text-right py-3 text-foreground font-semibold">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {foundersOrder.map((founder) => (
                    <tr
                      key={founder}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 text-foreground font-medium">{founder}</td>
                      <td className="text-right py-3 text-muted-foreground">
                        {founderShares[founder]?.toLocaleString() || '0'}
                      </td>
                      <td className="text-right py-3 text-muted-foreground">
                        {formatPercentage((founderShares[founder] / totalShares) * 100)}
                      </td>
                      <td className="text-right py-3 font-semibold text-green-500">
                        {formatCurrency(founderPayouts[founder] || 0, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart below table */}
          <div className="h-80">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Founder Payouts Distribution
            </h3>
            <div className="h-64">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other cards remain unchanged */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-card-foreground text-2xl flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Founder Ownership Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={barData} options={barOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-card-foreground text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Value at Exit Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={lineData} options={lineOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-card-foreground text-2xl flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" />
            Round-by-Round Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {results.breakdown.map((round, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 bg-muted/20"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {round.roundName}
                  </h3>
                  <span className="text-sm text-destructive bg-destructive/10 px-2 py-1 rounded">
                    Dilution: {round.dilutionPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-muted/50 p-3 rounded border border-border">
                    <p className="text-sm text-muted-foreground">Pre-Money Valuation</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(round.preMoneyValuation, currency)}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded border border-border">
                    <p className="text-sm text-muted-foreground">Investment</p>
                    <p className="text-lg font-semibold text-green-500">
                      {formatCurrency(round.capitalRaised, currency)}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded border border-border">
                    <p className="text-sm text-muted-foreground">Post-Money Valuation</p>
                    <p className="text-lg font-semibold text-blue-500">
                      {formatCurrency(round.postMoneyValuation, currency)}
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 overflow-x-auto">
                  <div>
                    <h4 className="text-md font-semibold text-foreground mb-2">
                      Ownership Before
                    </h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-foreground font-medium">Stakeholder</th>
                          <th className="text-right py-2 text-foreground font-medium">Ownership %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {round.ownershipBefore.map(({ name, percentage }) => (
                          <tr key={name} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{name}</td>
                            <td className="text-right py-2 text-muted-foreground">
                              {formatPercentage(percentage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-foreground mb-2">
                      Ownership After
                    </h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-foreground font-medium">Stakeholder</th>
                          <th className="text-right py-2 text-foreground font-medium">Ownership %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {round.ownershipAfter.map(({ name, percentage }) => (
                          <tr key={name} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{name}</td>
                            <td className="text-right py-2 text-muted-foreground">
                              {formatPercentage(percentage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
