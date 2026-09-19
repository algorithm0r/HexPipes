// `var`, not `const`, so the binding attaches to globalThis and runner.mjs can
// read it after loading this file by indirect eval - conventions §0.
var DEFAULT_PARAMETERS = {
    maxTicks: 200_000,

    // Framework parameters
    updatesPerTick: 1,
    ticksPerDraw: 1000,
    reportingPeriod: 200,
    db: "HexPipes",
    collection: "normal-data-start-2026-04-26",
    ip: "https://73.19.38.112:8888", // Canvas parameters
    canvasWidth: 1600,
    canvasHeight: 1200,
    gridOffsetX: 500,        // X offset to center grid
    gridOffsetY: 550,        // Y offset to center grid

    // Hex Grid parameters
    gridRadius: 16,          // Radius of hex grid (10 = 271 cells)
    cellSize: 16,            // Size of each hex cell in pixels
    addOrganismsOnTick: 200, // Tick that new organisms are added

    numOrganisms: 30,        // Initial number of organisms
    k_diffusion: 0.15,       // Diffusion rate (must be < 1/6 ≈ 0.167 for stability)

    // Pipe flow parameters
    k_pipe: 0.75,             // Pipe flow rate
    loss_rate: 0.05,          // Fraction of flow converted to energy (0.1-0.3)
    resourceDecay: 0,         // Fraction of cell resource lost per tick
    energyDecay: 0.01,        // Fraction of organism energy lost per tick

    // Evolution parameters
    energyMax: 150,               // The maximum amount of energy that can be stored at one time
    reproductionThreshold: 100,   // Energy needed to reproduce
    mutationRate: 0.05,           // chance per endpoint/configuration
    deathRate: 0.005,             // death chance per tick (lightning bolt)
    starvationRate: 0.5,          // death chance per tick if low energy
    starvationThreshold: 0.01,    // fraction of reproductionThreshold considered "low energy"

    arrowLength: 6,          // Length of flow direction arrows
    circleRadius: 3,         // Radius of flow direction circle

    graphVertPadding: 25,    // Graph vertical padding in pixels
    graphHoriPadding: 15,    // Graph horizontal padding in pixels
    graphWidth: 600,
    graphHeight: 120,

    randomSeed: 0, // will be overriden

    enforceMaxEnergy: false,
    allowAttachments: true,
};

var PARAMETERS = structuredClone(DEFAULT_PARAMETERS);

// The control panel is a read-only display of the run currently executing.
// Parameters come from DEFAULT_PARAMETERS overlaid with the active `runs` entry
// in main.js - not from these inputs. To drive a specific run, use replayRun()
// or the ?seed= / ?run= query parameters (see main.js).
function storeParameters() {
    if (!HAS_DOM) return;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    const check = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = value;
    };

    set("runName", PARAMETERS.name);
    set("numOrganisms", PARAMETERS.numOrganisms);
    set("mutationRate", PARAMETERS.mutationRate);
    set("reproductionThreshold", PARAMETERS.reproductionThreshold);
    set("deathRate", PARAMETERS.deathRate);
    set("starvationRate", PARAMETERS.starvationRate);
    set("starvationThreshold", PARAMETERS.starvationThreshold);
    set("k_diffusion", PARAMETERS.k_diffusion);
    set("k_pipeFlow", PARAMETERS.k_pipe);
    set("lossRate", PARAMETERS.loss_rate);
    set("gridRadius", PARAMETERS.gridRadius);
    set("cellSize", PARAMETERS.cellSize);
    set("randomSeed", PARAMETERS.randomSeed);   // .value, not .checked - this is
                                                // the seed that replays the run
    check("enforceMaxEnergy", PARAMETERS.enforceMaxEnergy);
}

// Grey the parameter inputs out. They report the running configuration; editing
// them would silently do nothing, so they are disabled rather than misleading.
function lockParameterPanel() {
    if (!HAS_DOM) return;
    const panel = document.getElementById("parameters");
    if (!panel) return;
    for (const el of panel.querySelectorAll("input, select")) {
        el.disabled = true;
        el.title = "Read-only: shows the running configuration. Use replayRun(seed) or ?seed=";
    }
}

var BACKGROUND_COLOR = "#000000";
var TEXT_COLOR = "#E0DEF4";

var GREY = "#908CAA";
var GREY_RGB  = parseHexColor(GREY);
var BLACK_RGB = parseHexColor("#000000");
