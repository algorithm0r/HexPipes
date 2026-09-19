// ui.js — the single boundary between the DOM and the simulation core.
//
// The sim reads UI.*, never document.*. In the browser, syncUI() refreshes this
// object once per frame from the control panel. Headless there is no DOM, the
// defaults below stand, and the same src files run unchanged under runner.mjs.
//
// Rule: if you add a control that the simulation reads, add it HERE and read it
// through UI. A document.getElementById() inside a sim class breaks headless.

var HAS_DOM = typeof document !== "undefined" && document !== null;

// Defaults mirror the initial checked/selected state in index.html, so a
// headless run matches a browser run that nobody has touched.
var UI = {
    // Run control
    pause: false,
    drawEachTick: false,

    // Grid rendering
    cellDrawRed: false,
    cellDrawGreen: false,
    cellDrawBlue: false,
    organismDisplay: "base15",   // grey | base5 | base15 | black | energy
    organismPipes: "none",       // none | color | flow
    endpoints: false,

    // Census equivalence relation (see getLivingCountIndex in util.js)
    ignoreColor: true,
    ignoreDirectionality: true,
    ignoreRotation: false,
    sortTopOrgs: false,
};

function uiChecked(id, fallback) {
    if (!HAS_DOM) return fallback;
    const el = document.getElementById(id);
    return el ? el.checked : fallback;
}

function uiValue(id, fallback) {
    if (!HAS_DOM) return fallback;
    const el = document.getElementById(id);
    return el ? el.value : fallback;
}

// Refresh UI from the DOM. Cheap; safe to call every frame. No-op headless.
function syncUI() {
    if (!HAS_DOM) return;

    UI.pause        = uiChecked("pause", UI.pause);
    UI.drawEachTick = uiChecked("draw-each-tick", UI.drawEachTick);

    UI.cellDrawRed   = uiChecked("cell-draw-red", UI.cellDrawRed);
    UI.cellDrawGreen = uiChecked("cell-draw-green", UI.cellDrawGreen);
    UI.cellDrawBlue  = uiChecked("cell-draw-blue", UI.cellDrawBlue);

    UI.organismDisplay = uiValue("organism-display", UI.organismDisplay);
    UI.organismPipes   = uiValue("organism-pipes", UI.organismPipes);
    UI.endpoints       = uiChecked("endpoints", UI.endpoints);

    UI.ignoreColor          = uiChecked("ignore-color", UI.ignoreColor);
    UI.ignoreDirectionality = uiChecked("ignore-directionality", UI.ignoreDirectionality);
    UI.ignoreRotation       = uiChecked("ignore-rotation", UI.ignoreRotation);
    UI.sortTopOrgs          = uiChecked("sort-top-orgs", UI.sortTopOrgs);
}

// Write text into an element if it exists. No-op headless.
function uiText(id, html) {
    if (!HAS_DOM) return;
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}
