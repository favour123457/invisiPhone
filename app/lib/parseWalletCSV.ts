import { PublicKey } from "@solana/web3.js";

const MAX_CSV_BYTES = 1024 * 1024;

export function isValidSolanaAddress(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  try {
    const pk = new PublicKey(t);
    return pk.toBase58() === t;
  } catch {
    return false;
  }
}

/** Extract cells from CSV-ish text (commas and newlines). */
function splitCSVCells(raw: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (c === "," || c === "\n" || c === "\r")) {
      if (cur.trim()) cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) cells.push(cur.trim());
  return cells;
}

export async function parseWalletCSV(file: File): Promise<string[]> {
  if (file.size > MAX_CSV_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const text = await file.text();
  const cells = splitCSVCells(text);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const cell of cells) {
    if (isValidSolanaAddress(cell)) {
      const addr = cell.trim();
      if (!seen.has(addr)) {
        seen.add(addr);
        out.push(addr);
      }
    }
  }
  return out;
}
