// ============================================================================
// SHELVED - FEATURE IN PROGRESS (Spring 2026, Elijah Immer)
//
// GOAL: track lineages between shapes and organisms. Click a cell, and trace
// that organism's ancestry back through its parents, showing how the pipe
// configuration changed at each step - so a dominant configuration can be read
// as the end of a path through the space rather than just a winner.
//
// STATE: not working, and deliberately left that way rather than deleted.
//   - HexGrid.updateLineage() is disabled behind an early `return`; the body
//     that would set `grid.lineage` from a click is commented out.
//   - draw() below still refers to `this.livingCountsMatrix`,
//     `getLivingCountIndex()` and a bare `ctx` - those belong to OrganismGraph,
//     not here. It would throw if it ran; the `!this.grid.lineage` guard is all
//     that saves it.
//   - The blocker is HexGrid.pixelToHex(), which floors fractional axial
//     coordinates instead of rounding to the nearest hex, so clicks do not map
//     to the cell under the cursor.
//
// BEFORE RESUMING: decide whether per-organism ancestry is still needed. The
// base5/base15 taxonomy and the 8-relation census landed after this was
// started and may answer the same question in aggregate. See DEVPLAN Stage 4.
// ============================================================================

// `var X = class X` (not a bare class declaration) so the binding attaches to
// globalThis and the same file loads in the browser AND headless - conventions §0.
var Lineage = class Lineage {
    constructor(hexGrid) {
      this.grid = hexGrid;
      const lineageCanvas = HAS_DOM ? document.getElementById('lineage') : null;
      this.ctx = lineageCanvas ? lineageCanvas.getContext('2d') : null;
    }

    update() { }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (!this.grid.lineage) return;

        console.log(this.grid.lineage.organism);

        const center = {x: 100, y: 100};
        const size = 100;
        this.drawHex(this.ctx, center, size, GREY);

        const tempOrg = new Organism(this.hexGrid, "");

        ctx.save();

        const entries = this.livingCountsMatrix[this.getLivingCountIndex()].slice(0, 120);

        const pipe_mid_color_tmp = pipe_mid_color;
        pipe_mid_color = BLACK_RGB;
        var index = 0;
        entries.forEach(({count, pipes}) => {
            index++;

            this.drawHex(ctx, center, size, GREY);
            tempOrg.drawPipesAtPoint(ctx, center, size, pipes, false);
            ctx.font = "14px Arial";
            ctx.fillStyle = TEXT_COLOR;
            ctx.textAlign = "center";
            ctx.fillText(`${count}`, center.x, center.y + size + 16);
        });
        pipe_mid_color = pipe_mid_color_tmp;
        ctx.restore();
    }

    drawHex(ctx, center, size, color) {
        // Calculate vertices for flat-top hexagon
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            vertices.push({
                x: center.x + size * Math.cos(angle),
                y: center.y + size * Math.sin(angle)
            });
        }

        // Draw filled hexagon
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
