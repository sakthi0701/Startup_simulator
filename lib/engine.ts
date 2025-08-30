import {
  ScenarioInput,
  CalculationResponse,
  RoundBreakdown,
  ScenarioSummary,
  StakeholderOwnership,
  SafeAuditDetail,
} from './types';

export function calculateCapTable(input: ScenarioInput): CalculationResponse {
  try {
    const warnings: string[] = [];
    const stakeholders = new Map<string, { shares: number; type: 'Founder' | 'ESOP' | 'Investor' }>();
    let totalShares = input.initialShares;

    // Use a Set to keep track of founder names and prevent duplicates
    const founderNames = new Set<string>();
    input.founders.forEach(f => {
      if (founderNames.has(f.name)) {
        throw new Error(`Duplicate founder name: ${f.name}`);
      }
      founderNames.add(f.name);
    });

    const initialFounderEquitySum = input.founders.reduce((sum, f) => sum + (f.equityPercent || 0), 0);
    if (Math.abs(initialFounderEquitySum + input.initialEsopPoolPercent - 100) > 0.01) {
      throw new Error("Initial equity (Founders + ESOP) must sum to 100%.");
    }

    input.founders.forEach(founder => {
        const shares = founder.shares || ((founder.equityPercent || 0) / 100) * totalShares;
        stakeholders.set(founder.name, { shares, type: 'Founder' });
    });

    if (input.initialEsopPoolPercent > 0) {
      const esopShares = (input.initialEsopPoolPercent / 100) * totalShares;
      stakeholders.set('ESOP', { shares: esopShares, type: 'ESOP' });
    }

    const roundBreakdowns: RoundBreakdown[] = [];
    let previousTotalShares = totalShares;

    for (const round of input.rounds) {
      const ownershipBefore = getOwnershipSnapshot(stakeholders, totalShares);
      let preMoneyShares = totalShares;

      if (round.esopTopUp?.isPreMoney) {
          const currentEsopShares = stakeholders.get('ESOP')?.shares || 0;
          const otherHoldersShares = totalShares - currentEsopShares;
          const newEsopShares = (otherHoldersShares * round.esopTopUp.percentage) / (100 - round.esopTopUp.percentage) - currentEsopShares;
          if (newEsopShares > 0) {
              stakeholders.set('ESOP', { shares: currentEsopShares + newEsopShares, type: 'ESOP' });
              totalShares += newEsopShares;
              preMoneyShares = totalShares;
          }
      }
      
      const pricedRoundSharePrice = round.preMoneyValuation / preMoneyShares;
      let totalSafeInvestment = 0;
      const safeAuditDetails: SafeAuditDetail[] = [];
      
      round.safes.forEach(safe => {
        totalSafeInvestment += safe.amount;
        const priceFromCap = safe.valuationCap ? safe.valuationCap / preMoneyShares : Infinity;
        const priceFromDiscount = pricedRoundSharePrice * (1 - (safe.discount || 0) / 100);
        const effectiveSafePrice = Math.min(priceFromCap, priceFromDiscount, pricedRoundSharePrice);
        const newSharesForSafe = safe.amount / effectiveSafePrice;
        
        safeAuditDetails.push({
          safeName: safe.name,
          amount: safe.amount,
          valuationCap: safe.valuationCap,
          discount: safe.discount,
          priceFromCap: safe.valuationCap ? priceFromCap : undefined,
          priceFromDiscount: safe.discount ? priceFromDiscount : undefined,
          finalConversionPrice: effectiveSafePrice,
          sharesFromSafe: newSharesForSafe,
        });
        
        const existingSafe = stakeholders.get(safe.name);
        stakeholders.set(safe.name, { shares: (existingSafe?.shares || 0) + newSharesForSafe, type: 'Investor' });
        totalShares += newSharesForSafe;
      });

      const newSharesForPricedRound = round.capitalRaised / pricedRoundSharePrice;
      const pricedInvestorName = `${round.name} Investors`;
      stakeholders.set(pricedInvestorName, { shares: newSharesForPricedRound, type: 'Investor' });
      totalShares += newSharesForPricedRound;
      
      if (round.founderSecondary && round.founderSecondary.length > 0) {
        const pricedRoundInvestor = stakeholders.get(pricedInvestorName);
        if (pricedRoundInvestor) {
          for (const secondary of round.founderSecondary) {
            const sellingFounder = stakeholders.get(secondary.founderName);
            if (sellingFounder) {
              const sharesToSell = secondary.amount / pricedRoundSharePrice;
              if (sellingFounder.shares >= sharesToSell) {
                sellingFounder.shares -= sharesToSell;
                pricedRoundInvestor.shares += sharesToSell;
              } else {
                warnings.push(
                  `${secondary.founderName} does not have enough shares to sell ${sharesToSell.toLocaleString()} shares in the ${round.name} round. They only have ${sellingFounder.shares.toLocaleString()} shares.`
                );
              }
            }
          }
        }
      }
      if (round.esopTopUp && !round.esopTopUp.isPreMoney) {
          const targetEsopShares = totalShares / (1 - (round.esopTopUp.percentage / 100)) * (round.esopTopUp.percentage / 100);
          const currentEsopShares = stakeholders.get('ESOP')?.shares || 0;
          const newEsopShares = targetEsopShares - currentEsopShares;
          if (newEsopShares > 0) {
              stakeholders.set('ESOP', { shares: currentEsopShares + newEsopShares, type: 'ESOP' });
              totalShares += newEsopShares;
          }
      }

      const ownershipAfter = getOwnershipSnapshot(stakeholders, totalShares);
      const postMoneyValuation = round.preMoneyValuation + round.capitalRaised + totalSafeInvestment;
      const dilutionPercent = (1 - (previousTotalShares / totalShares)) * 100;
      previousTotalShares = totalShares;

      roundBreakdowns.push({
        roundName: round.name,
        preMoneyValuation: round.preMoneyValuation,
        capitalRaised: round.capitalRaised,
        postMoneyValuation,
        preMoneyShares,
        pricedRoundSharePrice,
        ownershipBefore,
        ownershipAfter,
        dilutionPercent,
        safeAuditDetails,
      });
    }

    const finalOwnership = getOwnershipSnapshot(stakeholders, totalShares);
    const exitPayouts = finalOwnership.map(stakeholder => ({
      name: stakeholder.name, type: stakeholder.type, percentage: stakeholder.percentage,
      amount: (stakeholder.percentage / 100) * input.exitValuation,
    }));

    const finalPostMoneyValuation = roundBreakdowns.length > 0 ? roundBreakdowns[roundBreakdowns.length - 1].postMoneyValuation : input.rounds[0]?.preMoneyValuation || 0;
    const summary: ScenarioSummary = { finalPostMoneyValuation, finalOwnership, exitPayouts };
    return { summary, breakdown: roundBreakdowns, warnings: warnings.length > 0 ? warnings : undefined };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown calculation error occurred.";
    console.error("Calculation Error:", message);
    return { summary: {} as ScenarioSummary, breakdown: [], error: message };
  }
}

function getOwnershipSnapshot(stakeholders: Map<string, { shares: number; type: 'Founder' | 'ESOP' | 'Investor' }>, totalShares: number): StakeholderOwnership[] {
  const snapshot: StakeholderOwnership[] = [];
  if (totalShares === 0) return [];
  stakeholders.forEach((data, name) => {
    snapshot.push({ name, type: data.type as any, shares: data.shares, percentage: (data.shares / totalShares) * 100 });
  });
  return snapshot.sort((a, b) => b.shares - a.shares);
}