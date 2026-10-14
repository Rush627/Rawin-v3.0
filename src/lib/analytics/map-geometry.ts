import { WORLD_GRID } from "./world-grid";

/**
 * Geometry for the Analytics pixel map, all derived from the bundled grid (world-grid.ts): one
 * cell path per country, the boundaries between neighbouring countries, a per-country outline
 * and centre. No second geographic dataset is involved, so the boundaries always match the cells.
 */

export type Grid = {
  /** cell (col,row) → country code ("" = sea) */
  cells: string[];
  /** one SVG path of cells per country */
  paths: Map<string, string>;
  /** every edge between two different countries' cells, merged into runs */
  borders: string;
  /** mean cell centre per country, in grid units */
  centres: Map<string, { x: number; y: number }>;
};

/** Decoded once per page from the bundled grid (no second geographic dataset). */
let decoded: Grid | null = null;
export function decodeGrid(): Grid {
  if (decoded) return decoded;
  const { cols, rows, codes, data } = WORLD_GRID;
  const cells: string[] = new Array(cols * rows).fill("");
  const paths = new Map<string, string>();
  const sums = new Map<string, { x: number; y: number; n: number }>();
  data.forEach((row, r) => {
    let c = 0;
    for (const run of row.split(",")) {
      const [i, n] = run.split("*").map((x) => parseInt(x, 36));
      const code = codes[i] as string;
      for (let k = 0; k < n; k++, c++) {
        cells[r * cols + c] = code;
        if (!code) continue;
        paths.set(code, (paths.get(code) || "") + `M${c + 0.1} ${r + 0.1}h.8v.8h-.8z`);
        const s = sums.get(code) || { x: 0, y: 0, n: 0 };
        s.x += c + 0.5;
        s.y += r + 0.5;
        s.n++;
        sums.set(code, s);
      }
    }
  });
  const centres = new Map([...sums].map(([code, s]) => [code, { x: s.x / s.n, y: s.y / s.n }]));
  const borders = edges(cells, cols, rows, (a, b) => a !== "" && b !== "" && a !== b);
  decoded = { cells, paths, borders, centres };
  return decoded;
}

/**
 * Grid-line segments between neighbouring cells where `split(a, b)` holds, merged into straight
 * runs. Lines sit on the integer grid, i.e. in the gaps between the 0.8-unit cells. `off` shifts
 * the output back when the grid was padded.
 */
export function edges(cells: string[], cols: number, rows: number, split: (a: string, b: string) => boolean, off = 0): string {
  let d = "";
  // vertical edges, x = c + 1, merged down each column line
  for (let c = 0; c < cols - 1; c++) {
    let start = -1;
    for (let r = 0; r <= rows; r++) {
      const on = r < rows && split(cells[r * cols + c], cells[r * cols + c + 1]);
      if (on && start < 0) start = r;
      if (!on && start >= 0) {
        d += `M${c + 1 - off} ${start - off}V${r - off}`;
        start = -1;
      }
    }
  }
  // horizontal edges, y = r + 1, merged along each row line
  for (let r = 0; r < rows - 1; r++) {
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      const on = c < cols && split(cells[r * cols + c], cells[(r + 1) * cols + c]);
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        d += `M${start - off} ${r + 1 - off}H${c - off}`;
        start = -1;
      }
    }
  }
  return d;
}

/** The outline of one country: every edge between its cells and anything else (sea included). */
export function outline(grid: Grid, code: string): string {
  const { cols, rows } = WORLD_GRID;
  // pad the grid by one sea cell on every side so coasts at the frame still close
  const W = cols + 2;
  const padded: string[] = new Array(W * (rows + 2)).fill("");
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) padded[(r + 1) * W + c + 1] = grid.cells[r * cols + c] === code ? "x" : "";
  return edges(padded, W, rows + 2, (a, b) => a !== b, 1);
}

/** Five restrained intensity steps (square-root scale, so a few large countries do not flatten the rest). */
export function intensityLevel(visitors: number, max: number): number {
  if (visitors <= 0 || max <= 0) return 0;
  return Math.max(1, Math.min(5, Math.ceil(Math.sqrt(visitors / max) * 5)));
}
