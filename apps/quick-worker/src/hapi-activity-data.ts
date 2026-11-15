export const HAPI_ACTIVITY_KINDS = [
  "deposit","withdrawal","buy","sell","dividend","fee","interest","tax","reinvestment",
] as const;
export type HapiActivityKind = typeof HAPI_ACTIVITY_KINDS[number];
export type HapiActivityRow = {
  date:string;
  kind:HapiActivityKind;
  description:string;
  amountUsd:string;
  symbol?:string;
  quantity?:string;
  reference?:string;
};
export const HAPI_OUTFLOWS:ReadonlySet<HapiActivityKind> = new Set([
  "withdrawal","buy","fee","tax","reinvestment",
]);
