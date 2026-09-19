"use strict";

window.gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

var socket = null;
if (window.io !== undefined) {
  console.log("Database connected!");

  socket = io.connect(PARAMETERS.ip);

  socket.on("connect", function () {
    databaseConnected();
  });

  socket.on("disconnect", function () {
    databaseDisconnected();
  });

  socket.addEventListener("error", console.error)
  socket.addEventListener("log", console.log);
}

var arng = new alea();
const runs = [
  {
    name: "Default",
  },
  {
    name: "Connectivity",
    allowAttachments: false,
  },
  // {
  //   name: "Enforce Max Energy",
  //   enforceMaxEnergy: true,
  // },
];

// Start at a random index so it is evenly tested
var run_index = Math.floor(Math.random() * runs.length) % runs.length;

// A pending replay, set by replayRun() or by ?seed= / ?run= in the URL. When
// present the next reset() uses it instead of cycling to the next run, which is
// what makes a stored run reproducible: same seed + same overrides -> same
// trajectory. Cleared after one use.
var pendingReplay = null;

// Replay a stored run. `seed` is the randomSeed recorded in its data packet;
// `overrides` is the run entry (or any PARAMETERS subset) it executed under.
//   replayRun(123456789, { name: "Connectivity", allowAttachments: false })
function replayRun(seed, overrides = {}) {
  pendingReplay = { seed: seed, overrides: overrides };
  reset();
}

// ?seed=123456789&run=Connectivity
function pendingReplayFromURL() {
  if (typeof location === "undefined" || !location.search) return null;
  const q = new URLSearchParams(location.search);
  if (!q.has("seed")) return null;

  const seed = parseInt(q.get("seed"));
  if (!Number.isFinite(seed)) return null;

  const runName = q.get("run");
  const overrides = runName
    ? (runs.find((r) => r.name === runName) ?? {})
    : {};
  return { seed: seed, overrides: overrides };
}

function reset() {
    if (window.gameEngine.hexGrid) gameEngine.hexGrid.dataManager.logData();
    if (window.gameEngine) {
      window.gameEngine.stop();
    }

    PARAMETERS = structuredClone(DEFAULT_PARAMETERS);

    if (pendingReplay) {
      Object.assign(PARAMETERS, pendingReplay.overrides);
      PARAMETERS.randomSeed = pendingReplay.seed;
      console.log("Replaying run", PARAMETERS.name, "seed", PARAMETERS.randomSeed);
      pendingReplay = null;
    } else {
      Object.assign(PARAMETERS, runs[run_index]);
      PARAMETERS.randomSeed = Math.floor(Math.random() * 0xFFFF_FFFF);
      run_index = (run_index + 1) % runs.length;
    }

    storeParameters()

    const ctx = window.canvas.getContext("2d");
    // structure run id based on parameters

    window.arng = new alea(PARAMETERS.randomSeed);
    window.gameEngine = new GameEngine();
    window.gameEngine.init(ctx);

    window.hexGrid = new HexGrid();
    window.gameEngine.hexGrid = hexGrid;

    // HexGrid's constructor already builds its DataManager and registers it as
    // an entity. Constructing a second one here ran two managers side by side -
    // duplicated work, and graphs drawn twice over each other.
    window.dataManager = hexGrid.dataManager;

    window.lineage = new Lineage(hexGrid);
    window.gameEngine.addEntity(lineage);

    window.gameEngine.start();
}

ASSET_MANAGER.downloadAll(function () {
  console.log("starting up da sheild");
  window.canvas = document.getElementById("gameWorld");
  window.canvas.addEventListener('click', (e) => window.gameEngine.input(e));

  lockParameterPanel();

  pendingReplay = pendingReplayFromURL();
  reset();
});
