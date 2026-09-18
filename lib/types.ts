export type Bucket = "DROP" | "DELAY" | "DELEGATE";

export type Lang = "en" | "hi";

export interface ClassifiedItem {
  text: string;
  bucket: Bucket;
  reason: string;
}

export interface ClassifyResult {
  items: ClassifiedItem[];
  /** "llm" when a real model produced the result, "mock" when the built-in fallback did. */
  mode: "llm" | "mock";
  lang: Lang;
}

export interface ClassifyRequestBody {
  text: string;
  lang: Lang;
  /** Client hint that this is the built-in sample dump (bypasses the free char cap). */
  sample?: boolean;
}

export const BUCKETS: Bucket[] = ["DROP", "DELAY", "DELEGATE"];

export const MAX_ITEMS = 12;
