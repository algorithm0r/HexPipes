// smoketest.mjs — headless invariants for HexPipes. No DB, no browser.
//
//   node smoketest.mjs
//
// Prints the numbers that go in the DEVLOG entry, then PASS or FAIL.
// The determinism check is the important one: it is what makes a stored run
// replayable from its recorded randomSeed.

import { loadSim, runOnce } from "./runner.mjs";

let failures = 0;
let checks = 0;

function check(name, ok, detail = "") {
    checks++;
    if (ok) {
        console.log(`  ok   ${name}${detail ? "  " + detail : ""}`);
    } else {
        failures++;
        console.log(`  FAIL ${name}${detail ? "  " + detail : ""}`);
    }
}

// A trajectory fingerprint: enough of the run's shape that any divergence shows.
function trajectory({ grid, data }) {
    return JSON.stringify({
        population: data.population,
        unique: data.uniqueOrganisms,
        totalSpecies: data.totalSpecies,
        organisms: grid.organisms.length,
        totalEver: grid.organismGraph.totalOrganisms,
        kinds: grid.organismGraph.organismCount.size,
        positions: grid.organisms.map((o) => `${o.q},${o.r}`).sort(),
    });
}

function adjacentOrganismPairs(grid) {
    let pairs = 0;
    for (const org of grid.organisms) {
        for (const nb of grid.getNeighbors(org.q, org.r)) {
            if (nb.organism) pairs++;
        }
    }
    return pairs / 2;
}

console.log("HexPipes smoketest\n");
loadSim();

// ---------------------------------------------------------------- determinism
console.log("determinism");
const SEED = 424242;
const a = runOnce({ seed: SEED, ticks: 800 });
const b = runOnce({ seed: SEED, ticks: 800 });
check(
    "same seed reproduces the run exactly",
    trajectory(a) === trajectory(b),
    `seed=${SEED} organisms=${a.grid.organisms.length}`
);

const c = runOnce({ seed: SEED + 1, ticks: 800 });
check(
    "a different seed gives a different run",
    trajectory(a) !== trajectory(c),
    `organisms ${a.grid.organisms.length} vs ${c.grid.organisms.length}`
);

// -------------------------------------------------------------------- spawning
console.log("\nspawning");
const early = runOnce({ seed: SEED, ticks: 150 });
check(
    "no organisms before addOrganismsOnTick",
    early.grid.organisms.length === 0,
    `tick=${early.grid.tick} < ${early.params.addOrganismsOnTick}`
);

const spawned = runOnce({ seed: SEED, ticks: 260 });
check(
    "organisms exist after addOrganismsOnTick",
    spawned.grid.organisms.length > 0,
    `organisms=${spawned.grid.organisms.length}`
);

// ------------------------------------------------------------------ structure
console.log("\nstructure");
const s = a.grid;
check(
    "every organism is within grid bounds",
    s.organisms.every((o) => s.isInBounds(o.q, o.r))
);
check(
    "no organism sits on a source (edge) cell",
    s.organisms.every((o) => !s.isEdge(o.q, o.r))
);
check(
    "every organism's cell back-references it",
    s.organisms.every((o) => s.getCell(o.q, o.r)?.organism === o)
);
check(
    "every organism has 3 pipes covering all 6 sides",
    s.organisms.every((o) => {
        if (o.pipes.length !== 3) return false;
        const sides = new Set();
        for (const p of o.pipes) { sides.add(p.inputSide); sides.add(p.outputSide); }
        return sides.size === 6;
    })
);
check(
    "census agrees with the organism list",
    s.organismGraph.livingIDs.length === s.organisms.length,
    `${s.organismGraph.livingIDs.length} == ${s.organisms.length}`
);

// ---------------------------------------------------------------- attachment
console.log("\nattachment");
const conn = runOnce({ seed: SEED, ticks: 800, run: "Connectivity" });
check(
    "allowAttachments=false produces no adjacent organisms",
    adjacentOrganismPairs(conn.grid) === 0,
    `pairs=${adjacentOrganismPairs(conn.grid)} organisms=${conn.grid.organisms.length}`
);
check(
    "Connectivity run differs from Default on the same seed",
    trajectory(conn) !== trajectory(a)
);

// -------------------------------------------------------------------- summary
console.log("\nnumbers for the DEVLOG entry");
console.log(`  Default      seed=${SEED} ticks=800  organisms=${a.grid.organisms.length} ` +
            `livingKinds=${a.grid.organismGraph.uniqueLivingIDs.size} ` +
            `totalEver=${a.grid.organismGraph.totalOrganisms} ` +
            `uniqueKinds=${a.grid.organismGraph.organismCount.size}`);
console.log(`  Connectivity seed=${SEED} ticks=800  organisms=${conn.grid.organisms.length} ` +
            `livingKinds=${conn.grid.organismGraph.uniqueLivingIDs.size} ` +
            `totalEver=${conn.grid.organismGraph.totalOrganisms} ` +
            `uniqueKinds=${conn.grid.organismGraph.organismCount.size}`);

console.log(`\n${failures === 0 ? "PASS" : "FAIL"}  (${checks - failures}/${checks} checks)`);
process.exit(failures === 0 ? 0 : 1);
