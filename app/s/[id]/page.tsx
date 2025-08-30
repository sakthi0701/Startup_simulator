"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { loadScenario } from '@/lib/supabase';

export default function SharedScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedScenario = async () => {
      try {
        const id = params.id as string;
        if (!id) {
          throw new Error('No scenario ID provided');
        }

        const scenario = await loadScenario(id);
        
        // Store the scenario data in localStorage for the main page to pick up
        localStorage.setItem('sharedScenario', JSON.stringify(scenario.data));
        
        // Redirect to main page after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
        
      } catch (err) {
        console.error('Failed to load scenario:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scenario');
        
        // Redirect to main page after error
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    loadSharedScenario();
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0f0f0f] text-foreground flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 bg-card/80 border-border backdrop-blur-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-card-foreground">
            {loading ? 'Loading Scenario...' : error ? 'Error' : 'Scenario Loaded!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Loading your shared scenario...
              </p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to main page...
              </p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-foreground">
                Scenario loaded successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to simulator...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}