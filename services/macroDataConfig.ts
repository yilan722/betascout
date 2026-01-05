// Macro Indicators Manual Data Configuration
// This file stores manually updated values for indicators that cannot be automatically fetched
// Update these values when new data is published

export interface ManualMacroData {
  bofa_cash?: {
    value: number;
    date: string; // YYYY-MM-DD format
    source: string;
  };
  mutual_fund_cash?: {
    value: number;
    date: string;
    source: string;
  };
  naaim?: {
    value: number;
    date: string;
    source: string;
  };
  cftc_net_long?: {
    value: number;
    date: string;
    source: string;
  };
}

// Manual data overrides (update these when new data is published)
export const MANUAL_MACRO_DATA: ManualMacroData = {
  bofa_cash: {
    value: 3.3,
    date: '2025-12-29',
    source: 'BofA Global Fund Manager Survey (Dec 2025)',
  },
  // mutual_fund_cash: {
  //   value: 2.1,
  //   date: '2025-12-01',
  //   source: 'ICI Monthly Report',
  // },
  // naaim: {
  //   value: 75,
  //   date: '2025-12-26',
  //   source: 'NAAIM.org',
  // },
  // cftc_net_long: {
  //   value: 65,
  //   date: '2025-12-27',
  //   source: 'CFTC COT Report',
  // },
};




