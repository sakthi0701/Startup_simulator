import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmpnhfkpxbrdpzrntdvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcG5oZmtweGJyZHB6cm50ZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDQyOTUsImV4cCI6MjA3MjEyMDI5NX0.ZiCXxhMBVISbC1RshmrO5bu39K8G2mzv4yyRXfsXtgI';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ScenarioData {
  id?: string;
  created_at?: string;
  data: {
    founders: any[];
    initialShares: number;
    initialEsopPoolPercent: number;
    rounds: any[];
    exitValuation: number;
    currency: string;
  };
}

export async function saveScenario(scenarioData: ScenarioData['data']) {
  const { data, error } = await supabase
    .from('scenarios')
    .insert([{ data: scenarioData }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save scenario: ${error.message}`);
  }

  return data;
}

export async function loadScenario(id: string) {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to load scenario: ${error.message}`);
  }

  return data;
}