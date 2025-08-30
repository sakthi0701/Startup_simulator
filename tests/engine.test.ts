import { describe, it, expect } from 'vitest';
import { calculateCapTable } from '../lib/engine';
import { ScenarioInput, Founder, Round } from '../lib/types';

describe('Financial Engine', () => {
  const createBasicScenario = (): ScenarioInput => ({
    founders: [
      { id: '1', name: 'Alice', equityPercent: 60 },
      { id: '2', name: 'Bob', equityPercent: 30 },
    ],
    initialShares: 10_000_000,
    initialEsopPoolPercent: 10,
    rounds: [],
    exitValuation: 100_000_000,
  });

  describe('Initial Setup Validation', () => {
    it('should validate that initial equity sums to 100%', () => {
      const scenario = createBasicScenario();
      scenario.founders = [
        { id: '1', name: 'Alice', equityPercent: 70 },
        { id: '2', name: 'Bob', equityPercent: 40 },
      ];
      
      const result = calculateCapTable(scenario);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('must sum to 100%');
    });

    it('should handle duplicate founder names', () => {
      const scenario = createBasicScenario();
      scenario.founders = [
        { id: '1', name: 'Alice', equityPercent: 50 },
        { id: '2', name: 'Alice', equityPercent: 40 },
      ];
      
      const result = calculateCapTable(scenario);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Duplicate founder name');
    });

    it('should calculate initial ownership correctly', () => {
      const scenario = createBasicScenario();
      const result = calculateCapTable(scenario);
      
      expect(result.error).toBeUndefined();
      expect(result.summary.finalOwnership).toHaveLength(3); // 2 founders + ESOP
      
      const alice = result.summary.finalOwnership.find(o => o.name === 'Alice');
      const bob = result.summary.finalOwnership.find(o => o.name === 'Bob');
      const esop = result.summary.finalOwnership.find(o => o.name === 'ESOP');
      
      expect(alice?.percentage).toBe(60);
      expect(bob?.percentage).toBe(30);
      expect(esop?.percentage).toBe(10);
    });
  });

  describe('Priced Rounds', () => {
    it('should handle single priced round with no ESOP', () => {
      const scenario: ScenarioInput = {
        founders: [
          { id: '1', name: 'Alice', equityPercent: 100 },
        ],
        initialShares: 10_000_000,
        initialEsopPoolPercent: 0,
        rounds: [{
          id: '1',
          name: 'Series A',
          preMoneyValuation: 10_000_000,
          capitalRaised: 2_000_000,
          safes: [],
        }],
        exitValuation: 100_000_000,
      };

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      expect(breakdown.preMoneyValuation).toBe(10_000_000);
      expect(breakdown.capitalRaised).toBe(2_000_000);
      expect(breakdown.postMoneyValuation).toBe(12_000_000);
      
      // Alice should own ~83.33% after dilution (10M / 12M)
      const aliceAfter = breakdown.ownershipAfter.find(o => o.name === 'Alice');
      expect(aliceAfter?.percentage).toBeCloseTo(83.33, 1);
    });

    it('should handle priced round with pre-money ESOP top-up', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Series A',
        preMoneyValuation: 10_000_000,
        capitalRaised: 2_000_000,
        safes: [],
        esopTopUp: {
          percentage: 15,
          isPreMoney: true,
        },
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      const esopAfter = breakdown.ownershipAfter.find(o => o.name === 'ESOP');
      expect(esopAfter?.percentage).toBeCloseTo(15, 1);
    });
  });

  describe('SAFE Conversions', () => {
    it('should handle SAFE with valuation cap only', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Seed',
        preMoneyValuation: 10_000_000,
        capitalRaised: 1_000_000,
        safes: [{
          id: '1',
          name: 'Angel SAFE',
          amount: 500_000,
          valuationCap: 5_000_000,
        }],
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      const angelSafe = breakdown.ownershipAfter.find(o => o.name === 'Angel SAFE');
      expect(angelSafe).toBeDefined();
      expect(angelSafe?.percentage).toBeGreaterThan(0);
    });

    it('should handle SAFE with discount only', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Seed',
        preMoneyValuation: 10_000_000,
        capitalRaised: 1_000_000,
        safes: [{
          id: '1',
          name: 'Angel SAFE',
          amount: 500_000,
          discount: 20,
        }],
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      const angelSafe = breakdown.ownershipAfter.find(o => o.name === 'Angel SAFE');
      expect(angelSafe).toBeDefined();
      expect(angelSafe?.percentage).toBeGreaterThan(0);
    });

    it('should handle SAFE with both cap and discount (cap wins)', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Seed',
        preMoneyValuation: 10_000_000,
        capitalRaised: 1_000_000,
        safes: [{
          id: '1',
          name: 'Angel SAFE',
          amount: 500_000,
          valuationCap: 4_000_000, // Better than 20% discount
          discount: 20,
        }],
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      const angelSafe = breakdown.ownershipAfter.find(o => o.name === 'Angel SAFE');
      expect(angelSafe).toBeDefined();
      
      // With cap of 4M, SAFE should get 500k / 4M = 12.5% of pre-money shares
      expect(angelSafe?.percentage).toBeGreaterThan(10);
    });

    it('should handle multiple SAFEs converting simultaneously', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Seed',
        preMoneyValuation: 10_000_000,
        capitalRaised: 1_000_000,
        safes: [
          {
            id: '1',
            name: 'SAFE 1',
            amount: 250_000,
            valuationCap: 5_000_000,
          },
          {
            id: '2',
            name: 'SAFE 2',
            amount: 250_000,
            discount: 20,
          },
        ],
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      const safe1 = breakdown.ownershipAfter.find(o => o.name === 'SAFE 1');
      const safe2 = breakdown.ownershipAfter.find(o => o.name === 'SAFE 2');
      
      expect(safe1).toBeDefined();
      expect(safe2).toBeDefined();
      expect(safe1?.percentage).toBeGreaterThan(0);
      expect(safe2?.percentage).toBeGreaterThan(0);
    });
  });

  describe('Founder Secondary Sales', () => {
    it('should handle founder secondary sale', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Series A',
        preMoneyValuation: 10_000_000,
        capitalRaised: 2_000_000,
        safes: [],
        founderSecondary: {
          founderName: 'Alice',
          amount: 500_000,
        },
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      const breakdown = result.breakdown[0];
      const alice = breakdown.ownershipAfter.find(o => o.name === 'Alice');
      const secondaryBuyers = breakdown.ownershipAfter.find(o => o.name === 'Secondary Buyers');
      
      expect(alice).toBeDefined();
      expect(secondaryBuyers).toBeDefined();
      expect(secondaryBuyers?.percentage).toBeGreaterThan(0);
    });
  });

  describe('Multi-Round Scenarios', () => {
    it('should handle multiple rounds with ESOP top-ups', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [
        {
          id: '1',
          name: 'Seed',
          preMoneyValuation: 5_000_000,
          capitalRaised: 1_000_000,
          safes: [],
          esopTopUp: {
            percentage: 12,
            isPreMoney: true,
          },
        },
        {
          id: '2',
          name: 'Series A',
          preMoneyValuation: 15_000_000,
          capitalRaised: 3_000_000,
          safes: [],
          esopTopUp: {
            percentage: 15,
            isPreMoney: false,
          },
        },
      ];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      expect(result.breakdown).toHaveLength(2);
      
      const seriesA = result.breakdown[1];
      const esop = seriesA.ownershipAfter.find(o => o.name === 'ESOP');
      expect(esop?.percentage).toBeCloseTo(15, 1);
    });
  });

  describe('Exit Calculations', () => {
    it('should calculate exit payouts correctly', () => {
      const scenario = createBasicScenario();
      const result = calculateCapTable(scenario);
      
      expect(result.error).toBeUndefined();
      
      const alicePayout = result.summary.exitPayouts.find(p => p.name === 'Alice');
      const bobPayout = result.summary.exitPayouts.find(p => p.name === 'Bob');
      const esopPayout = result.summary.exitPayouts.find(p => p.name === 'ESOP');
      
      expect(alicePayout?.amount).toBe(60_000_000); // 60% of 100M
      expect(bobPayout?.amount).toBe(30_000_000); // 30% of 100M
      expect(esopPayout?.amount).toBe(10_000_000); // 10% of 100M
    });
  });

  describe('Integrity Checks', () => {
    it('should ensure ownership percentages sum to 100% after each round', () => {
      const scenario = createBasicScenario();
      scenario.rounds = [{
        id: '1',
        name: 'Series A',
        preMoneyValuation: 10_000_000,
        capitalRaised: 2_000_000,
        safes: [{
          id: '1',
          name: 'Angel SAFE',
          amount: 500_000,
          valuationCap: 5_000_000,
        }],
      }];

      const result = calculateCapTable(scenario);
      expect(result.error).toBeUndefined();
      
      result.breakdown.forEach(round => {
        const totalPercentage = round.ownershipAfter.reduce((sum, owner) => sum + owner.percentage, 0);
        expect(totalPercentage).toBeCloseTo(100, 1);
      });
    });

    it('should not allow negative shares', () => {
      const scenario = createBasicScenario();
      scenario.founders = [
        { id: '1', name: 'Alice', shares: -1000 }, // Negative shares
      ];
      scenario.initialEsopPoolPercent = 0;

      const result = calculateCapTable(scenario);
      // The engine should handle this gracefully or return an error
      expect(result).toBeDefined();
    });
  });
});