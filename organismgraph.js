class OrganismGraph {
    constructor(hexGrid) {
        this.hexGrid = hexGrid;
        this.organismCount = new Map(); // Map from organism ID to count 
        this.maxCount = 0;
        this.totalOrganisms = 0;
    }

    addOrganism(organism) {
        this.totalOrganisms++;
        const orgID = organism.organismID();
        if (this.organismCount.has(orgID)) {
            this.organismCount.set(orgID, this.organismCount.get(orgID) + 1);
        } else {
            this.organismCount.set(orgID, 1);
        }
        this.maxCount = Math.max(this.maxCount, this.organismCount.get(orgID));
        // console.log(`Added organism ${orgID}. Count: ${this.organismCount.get(orgID)} Map Size: ${this.organismCount.size}`);
        document.getElementById('orggraph').innerHTML = `Tick: ${this.hexGrid.tick} <br/> Total Organisms: ${this.totalOrganisms} <br/>Max Count: ${this.maxCount}<br/> Map Size: ${this.organismCount.size}`;
    }
}