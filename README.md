# Tumbling Hexagons - Stage 3 Complete: Evolution!

## What's Implemented

**Stage 3 is complete!** The simulation now has full evolution with reproduction, mutation, and death:

### Features:
- **Everything from Stage 1** (hex grid, RGB diffusion, colorful edge sources)
- **Organism Class**: Occupies grid cells, blocks diffusion
- **3 One-Way Pipes**: Each organism has 3 pipes connecting pairs of sides
- **Cell-Based Flow**: Pipes reference actual input/output cells (scales to multi-hex organisms)
- **15 Possible Configurations**: All ways to pair 6 sides into 3 pairs
- **6-Color Endpoints**: R, Y, G, C, B, M
  - Primaries (R,G,B): pull single resource
  - Secondaries (Y,C,M): pull TWO resources (limited by minimum of both)
- **Three-Pass Flow System**:
  1. **Calculate**: Each pipe determines desired flow based on available input/output
  2. **Normalize**: Scale down if multiple pipes compete for resources
  3. **Update**: Apply flows, extract energy, convert colors
- **Energy Accumulation**: Organism gains energy from color conversion
  - Energy = loss_rate × flow × (color_distance / 3)
  - Color distance: 0 (same color) to 3 (opposite colors on wheel)
- **Pipe Visualization**: Curved lines from side to side
  - Straight pipes (opposite sides) go through center
  - Others curve inward
  - Color gradient: input color → gray → output color
  - **Direction indicators**: Filled circle (⚫) at input, arrow triangle (▶) at output
- **Occupied Cells**: No diffusion through organism cells (R=G=B=0)

### Stage 3 - Evolution:
- **Reproduction**: When energy ≥ 100, organism creates mutated offspring
  - Spawns in closest legal spot within range 2
  - Costs 100 energy
  - Legal placement: not on edges, not touching other organisms
- **Mutation System** (5% chance per element):
  - **Color mutation**: Each pipe endpoint can randomly change color
  - **Configuration mutation**: Two endpoints from different pipes can swap positions
  - Maintains valid pipe structure
- **Death Mechanic**: 1% random chance per tick (⚡ lightning bolt)
  - Clears organism from grid
  - Creates space for new organisms
- **Population Dynamics**: Birth/death balance drives evolution

### Test Setup:
- **8 initial organisms** spawned at random legal locations (not touching, not on edges)
- Each has random pipe configuration with random colors
- Evolution parameters tuned for observable dynamics
- Watch the population evolve over time!

### Files:
- **organism.js** (UPDATED): Added reproduction with mutation, tryReproduce() method
- **hexgrid.js** (UPDATED): Added isLegalPlacement(), reproduction/death in update loop
- **params.js** (UPDATED): Added reproductionThreshold (100), mutationRate (0.05), deathRate (0.01)
- **index.html**: Stage 3 description
- Previous files: main.js, framework files unchanged

### Key Parameters (params.js):
```javascript
gridRadius: 10          // Creates 271 cells
cellSize: 15            // Pixel size of each hex
gridOffsetX: 400        // Centers grid in canvas
gridOffsetY: 400
k_diffusion: 0.08       // Diffusion rate (< 1/6 for stability)
k_pipe: 0.2             // Pipe flow rate (tuned for visibility)
loss_rate: 0.02         // Fraction converted to energy
reproductionThreshold: 100  // Energy needed to reproduce
mutationRate: 0.05      // 5% chance per mutation element
deathRate: 0.01         // 1% chance per tick (lightning bolt)
```

## How to Run:
1. Open `index.html` in a web browser
2. Watch colorful resources diffuse from the white edge cells inward!

## What You'll See:
- Rainbow colors diffusing from the hex edges
- **8 initial black hexes** scattered around - the starting population
- **Colored pipes on each organism** with direction indicators:
  - **Filled circle (⚫)** at input end
  - **Arrow triangle (▶)** at output end
- **Resources actively flowing** through the pipes
- **Evolution happening in real-time!**
  - 🧬 **Reproduction**: Organisms spawn offspring when reaching 100 energy
  - ⚡ **Death**: Random lightning strikes remove organisms
  - 🎲 **Mutation**: Offspring have different colors/configurations
  - Watch population grow, shrink, and adapt!
- **Console logs** showing:
  - Initial organism spawn locations
  - Energy accumulation
  - Reproduction events (🧬)
  - Death events (⚡)
  - Population dynamics

## Simulation Complete! 🎉

All three stages are implemented:
- ✅ Stage 1: Hex grid with colorful diffusion
- ✅ Stage 2: Organisms with pipe flow and energy accumulation
- ✅ Stage 3: Evolution with reproduction, mutation, and death

## Possible Future Enhancements:
- Multi-hex organisms (merging when offspring placed adjacent with compatible colors)
- More sophisticated mutation (gradual color shifts on wheel, not just random)
- Fitness tracking and analysis
- Data visualization (population graphs, energy distribution)
- Different environmental patterns (not just edge sources)
- Organism "species" based on pipe configuration clusters

## Tuning Tips:
- **k_diffusion**: Lower = slower diffusion (0.08 is good default)
- **k_pipe**: Controls flow speed (0.2 gives visible flow)
- **loss_rate**: Lower = more resource output, less energy (0.02 allows faster growth)
- **reproductionThreshold**: Lower = faster reproduction, higher = slower (100 is balanced)
- **mutationRate**: Higher = more variation, lower = more stability (0.05 = 5%)
- **deathRate**: Higher = more turnover, lower = longer lives (0.01 = 1%)
- **updatesPerDraw**: Increase to 5-10 to speed up evolution

## What to Watch For:
- Does the population stabilize or keep growing?
- Do certain pipe configurations become dominant?
- How does position affect success? (center vs edges)
- What happens when the grid fills up?
- Do you see lineages adapting to their environment?

## Technical Notes:

### Axial Coordinates:
- Each hex has (q, r) coordinates
- Neighbors found by adding direction offsets: [(+1,0), (+1,-1), (0,-1), (-1,0), (-1,+1), (0,+1)]
- Hex shape constraint: max(|q|, |r|, |q+r|) ≤ radius

### Diffusion Algorithm:
1. **Calculate Pass**: For each cell, compute net flow from all neighbors
2. **Update Pass**: Apply all flows simultaneously
3. **Reset Sources**: Edge cells return to 255

This ensures stable, symmetric diffusion!
