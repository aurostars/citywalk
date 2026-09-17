import type { Budget } from "../../types/domain";

export function matchesBudget(price: number, budget: Budget): boolean {
  if (budget === "any") return price >= 0;
  if (budget === "free") return price === 0;
  if (budget === "under-100") return price >= 0 && price <= 100;
  if (budget === "100-300") return price > 100 && price <= 300;
  return price > 300;
}
