import type { Dispatch, SetStateAction } from "react";
import { useOutletContext } from "react-router-dom";

export type ExpensesOutletContext = {
  year: number;
  month: number | null;
  setYear: Dispatch<SetStateAction<number>>;
  setMonth: Dispatch<SetStateAction<number | null>>;
};

export function useExpensesFilter() {
  return useOutletContext<ExpensesOutletContext>();
}
