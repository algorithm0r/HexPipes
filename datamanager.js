class DataManager {
    constructor(automata) {
        this.automata = automata;

        // Time tracking data for HUD
        this.currentDay = 0;
        this.currentTick = 0;
        
        this.fish = [];
        this.eggs = [];

        // Fish action data for graphs
        this.actionData = {
            move: [],
            feed: [],
            layEgg: [],
            rest: []
        };
        
        // Fish phase data for graphs
        this.phaseData = {
            eggLaying: [],
            feeding: [],
            dormant: []
        };
        
        // Initialize data arrays with zeros
        this.initializeDataArrays();
        
        // References to graphs
        this.actionGraph = null;
        this.phaseGraph = null;
        
        // Create graphs
        this.createGraphs();
    }
    
    initializeDataArrays() {
        // Initialize with 192 data points (2 days) of zeros
        const maxDataPoints = PARAMETERS.ticksPerDay * 2;
        
        for (let i = 0; i < maxDataPoints; i++) {
            this.actionData.move.push(0);
            this.actionData.feed.push(0);
            this.actionData.layEgg.push(0);
            this.actionData.rest.push(0);
            
            this.phaseData.eggLaying.push(0);
            this.phaseData.feeding.push(0);
            this.phaseData.dormant.push(0);
        }
    }
    
    createGraphs() {
        const vertSize = 120;
        // Create action graph
        this.populationGraph = new Graph(800, 0, [this.fish, this.eggs], "Fish and Eggs", 0, 0);
        gameEngine.addGraph(this.populationGraph);

        this.actionGraph = new Graph(800, vertSize, 
            [
                this.actionData.move,
                this.actionData.feed,
                this.actionData.layEgg,
                this.actionData.rest
            ],
            "Fish Actions", 0, 100, false);
        this.actionGraph.colors = ["#7070FF", "#70FF70", "#FFFF00", "#FF7070"];
        gameEngine.addGraph(this.actionGraph);
        
        // Create phase graph
        this.phaseGraph = new Graph(800, 2*vertSize,
            [
                this.phaseData.eggLaying,
                this.phaseData.feeding,
                this.phaseData.dormant
            ],
            "Fish Phases", 0, 100, false);
        this.phaseGraph.colors = ["#FFFF00", "#70FF70", "#7070FF"];
        gameEngine.addGraph(this.phaseGraph);
    }

    updateData() {
        // Update time tracking
        this.currentDay = this.automata.day;
        this.currentTick = this.automata.currentTick;
        
        // Count fish actions and phases
        let moveCount = 0;
        let feedCount = 0;
        let layEggCount = 0;
        let restCount = 0;
        
        let eggLayingCount = 0;
        let feedingCount = 0;
        let dormantCount = 0;
        
        // Count actions from current tick
        for (const fish of this.automata.fish) {
            // Count phases
            if (fish.phase === "egg_laying") eggLayingCount++;
            else if (fish.phase === "feeding") feedingCount++;
            else if (fish.phase === "dormant") dormantCount++;
            
            // Count planned actions
            if (fish.plannedAction === "move") moveCount++;
            else if (fish.plannedAction === "feed") feedCount++;
            else if (fish.plannedAction === "lay_egg") layEggCount++;
            else if (fish.plannedAction === "rest") restCount++;
        }
        
        // Shift out old data (remove first element) and add new data
        // for (const key in this.actionData) {
        //     this.actionData[key].shift();
        // }
        // for (const key in this.phaseData) {
        //     this.phaseData[key].shift();
        // }

        // Add new data points
        this.actionData.move.push(moveCount);
        this.actionData.feed.push(feedCount);
        this.actionData.layEgg.push(layEggCount);
        this.actionData.rest.push(restCount);
        
        this.phaseData.eggLaying.push(eggLayingCount);
        this.phaseData.feeding.push(feedingCount);
        this.phaseData.dormant.push(dormantCount);
             
        // Calculate dynamic max values for better graph scaling
        const maxAction = Math.max(
            ...this.actionData.move,
            ...this.actionData.feed,
            ...this.actionData.layEgg,
            ...this.actionData.rest
        );
        
        const maxPhase = Math.max(
            ...this.phaseData.eggLaying,
            ...this.phaseData.feeding,
            ...this.phaseData.dormant
        );
        
        // Add 10% buffer to max values for better visualization
        this.actionGraph.maxVal = Math.ceil(maxAction * 1.1) || 100;
        this.phaseGraph.maxVal = Math.ceil(maxPhase * 1.1) || 100;
    }

    logData() {
        const data = {
            db: PARAMETERS.db,
            collection: PARAMETERS.collection,
            data: {
                PARAMS: PARAMETERS,
                day: this.currentDay,
                totalFish: this.automata.fish.length,
                totalEggs: this.automata.eggs.length,
                actionData: this.actionData,
                phaseData: this.phaseData
            }
        };

        if (socket) socket.emit("insert", data);
    }

    update() {
        // Update data every tick (not just on reporting periods)
        this.updateData();
        
        // Log data to database on reporting periods
        if (this.automata.currentTick % PARAMETERS.reportingPeriod === 0) {
            // update population
            this.fish.push(this.automata.fish.length);
            this.eggs.push(this.automata.eggs.length);
            // this.logData();
        }
    }

    draw(ctx) {
        // Draw the HUD
        this.drawHUD(ctx);
    }
    
    drawHUD(ctx) {
        const hud = {
            x: PARAMETERS.pixelDimension,
            y: PARAMETERS.pixelDimension - 50,
            width: PARAMETERS.graphWidth,
            height: 50
        };
        
        // Draw HUD background
        ctx.fillStyle = "rgba(240, 240, 240, 0.8)";
        ctx.fillRect(hud.x, hud.y, hud.width, hud.height);
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(hud.x, hud.y, hud.width, hud.height);
        
        // Draw day counter
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.font = "14px Arial";
        ctx.fillText(`Day: ${this.currentDay}`, hud.x + 6, hud.y + 16);
        
        // Draw tick slider
        const sliderWidth = hud.width - 120;
        const sliderX = hud.x + 100;
        const sliderY = hud.y + 25;
        
        // Draw slider background
        ctx.fillStyle = "#DDDDDD";
        ctx.fillRect(sliderX, sliderY - 5, sliderWidth, 10);
        
        // Draw slider position
        const sliderPos = sliderX + (sliderWidth * this.currentTick / PARAMETERS.ticksPerDay);
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(sliderPos, sliderY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw time labels
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.fillText("Time:", sliderX - 50, sliderY + 5);
        
        // Draw time markers
        ctx.textAlign = "center";
        ctx.fillStyle = "#888888";
        const timeMarkers = [0, 6, 12, 18, 24];
        for (const hour of timeMarkers) {
            const markerX = sliderX + (sliderWidth * hour * 4 / PARAMETERS.ticksPerDay);
            ctx.fillText(hour.toString(), markerX, sliderY + 20);
            
            // Draw tick mark
            ctx.fillRect(markerX, sliderY - 8, 1, 16);
        }
        
        // Draw total counts
        ctx.textAlign = "right";
        ctx.fillStyle = "#000000";
        ctx.fillText(`Fish: ${this.automata.fish.length}  Eggs: ${this.automata.eggs.length}`, 
            hud.x + hud.width - 6, hud.y + 16);
    }
}