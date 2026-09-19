// runner.mjs — run HexPipes headless, no browser.
//
// Loads the SAME src files the browser loads (never a fork of the sim core,
// conventions §4) into the main V8 realm via indirect eval. Main realm rather
// than `vm` because vm costs ~7-10x on hot loops that read globals every tick,
// and one config per process needs no sandbox.
//
// Usage:
//   node runner.mjs                              one Default run, maxTicks
//   node runner.mjs --ticks 5000                 shorter
//   node runner.mjs --run Connectivity           a named run from main.js
//   node runner.mjs --seed 12345                 reproduce a stored run
//   node runner.mjs --reps 10 --ticks 2000       batch
//   node runner.mjs --json                       machine-readable summary

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// Dependency order, exactly as index.html loads them. gameengine/main/
// assetmanager are browser wiring and are deliberately absent: the runner
// drives the tick loop itself.
const SIM_FILES = [
    "vender/alea.js",
    "ui.js",
    "util.js",
    "params.js",
    "histogram.js",
    "graph.js",
    "organism.js",
    "organismgraph.js",
    "hexgrid.js",
    "datamanager.js",
];

// The named runs from main.js. Kept in sync by hand — main.js is browser
// wiring, so the runner cannot load it.
export const RUNS = {
    Default: {},
    Connectivity: { allowAttachments: false },
};

function loadSim() {
    // Indirect eval: runs in global scope, so top-level `var` (including
    // `var Foo = class Foo`) attaches to globalThis for the next file.
    const geval = eval;
    for (const rel of SIM_FILES) {
        const src = readFileSync(join(HERE, rel), "utf8").replace(/^\s*["']use strict["'];?/m, "");
        try {
            geval(src);
        } catch (err) {
            throw new Error(`failed loading ${rel}: ${err.message}`, { cause: err });
        }
    }
}

// One run. Returns the DataManager so the caller can read its metric series.
export function runOnce({ seed, ticks, run = "Default", overrides = {} } = {}) {
    if (!(run in RUNS)) throw new Error(`unknown run "${run}" (have: ${Object.keys(RUNS).join(", ")})`);

    globalThis.PARAMETERS = structuredClone(globalThis.DEFAULT_PARAMETERS);
    Object.assign(globalThis.PARAMETERS, RUNS[run], overrides);
    globalThis.PARAMETERS.name = run;
    globalThis.PARAMETERS.randomSeed =
        seed ?? Math.floor(Math.random() * 0xFFFF_FFFF);

    // Same seeding the browser does in reset().
    globalThis.arng = new globalThis.alea(globalThis.PARAMETERS.randomSeed);

    const grid = new globalThis.HexGrid();
    const data = new globalThis.DataManager(grid);

    const limit = ticks ?? globalThis.PARAMETERS.maxTicks;
    for (let t = 0; t < limit; t++) {
        grid.update();
        data.update();
    }

    return { grid, data, params: globalThis.PARAMETERS };
}

function summarize({ grid, data, params }) {
    return {
        run: params.name,
        seed: params.randomSeed,
        ticks: grid.tick,
        organisms: grid.organisms.length,
        livingKinds: grid.organismGraph.uniqueLivingIDs.size,
        totalOrganisms: grid.organismGraph.totalOrganisms,
        uniqueKinds: grid.organismGraph.organismCount.size,
        maxCount: grid.organismGraph.maxCount,
        samples: data.population.length,
    };
}

function parseArgs(argv) {
    const a = { reps: 1, json: false };
    for (let i = 0; i < argv.length; i++) {
        const k = argv[i];
        if (k === "--json") a.json = true;
        else if (k === "--ticks") a.ticks = parseInt(argv[++i]);
        else if (k === "--seed") a.seed = parseInt(argv[++i]);
        else if (k === "--reps") a.reps = parseInt(argv[++i]);
        else if (k === "--run") a.run = argv[++i];
        else throw new Error(`unknown argument ${k}`);
    }
    return a;
}

// Only run the CLI when invoked directly, not when imported by smoketest.mjs.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const args = parseArgs(process.argv.slice(2));
    loadSim();

    const results = [];
    for (let rep = 0; rep < args.reps; rep++) {
        const seed = args.seed === undefined ? undefined : args.seed + rep;
        const started = Date.now();
        const out = summarize(runOnce({ seed, ticks: args.ticks, run: args.run }));
        out.ms = Date.now() - started;
        results.push(out);
        if (!args.json) {
            console.log(
                `run=${out.run} seed=${out.seed} ticks=${out.ticks} ` +
                `organisms=${out.organisms} livingKinds=${out.livingKinds} ` +
                `totalEver=${out.totalOrganisms} uniqueKinds=${out.uniqueKinds} (${out.ms}ms)`
            );
        }
    }
    if (args.json) console.log(JSON.stringify(results, null, 2));
}

export { loadSim, summarize };
