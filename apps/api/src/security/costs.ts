export type UsageSnapshot = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

const parseCost = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const calculateAiCostUsd = (usage: UsageSnapshot) => {
  const inputCostPer1k = parseCost(process.env.OPENAI_INPUT_COST_PER_1K, 0);
  const outputCostPer1k = parseCost(process.env.OPENAI_OUTPUT_COST_PER_1K, 0);

  const inputCost = (usage.inputTokens / 1000) * inputCostPer1k;
  const outputCost = (usage.outputTokens / 1000) * outputCostPer1k;

  return Number((inputCost + outputCost).toFixed(6));
};

export const mergeUsage = (base: UsageSnapshot, next: UsageSnapshot): UsageSnapshot => ({
  inputTokens: base.inputTokens + next.inputTokens,
  outputTokens: base.outputTokens + next.outputTokens,
  totalTokens: base.totalTokens + next.totalTokens
});

export const emptyUsage = (): UsageSnapshot => ({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
