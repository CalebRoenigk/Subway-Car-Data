// TODO: CODE HERE
// This class is purely used to hold data to be used in a plot

// The main data object for a plot
class PlotData {
    constructor(plotType, plotGroups) {
        this.plotType = plotType;
        this.plotGroups = plotGroups;
        
        // Determine the minimum and maximum values of the plot groups
        this.getMinMax();
    }
    
    // Get a minimum and maximum for the plot groups and store the min/max values to the object
    getMinMax() {
        // The min/max values are determined differently depending on the plotType
        switch(this.plotType) {
            default:
            case 'Timeline':
                // Raw min/max
                this.minimum = this.plotGroups[0].groupData[0].value;
                this.maximum = this.plotGroups[0].groupData[0].value;
                this.plotGroups.forEach(plotGroup => {
                    let value = plotGroup.groupData[0].value;

                    this.minimum = Math.min(value, this.minimum);
                    this.maximum = Math.max(value, this.maximum);
                });
                break;
            case 'Group':
                // Index based
                this.minimum = 0;
                this.maximum = this.plotGroups.length-1;
                break;
        }
    }
    
    // Returns a count of all records present in the plot
    getRecordCount() {
        let recordCount = 0;
        this.plotGroups.forEach(group => {
            recordCount += group.groupData.length;
        });
        
        return recordCount;
    }
}

// A group of data that appears in a plot, groupData is an array of PlotValues
class PlotGroup {
    constructor(groupName, groupData) {
        this.groupName = groupName;
        this.groupData = groupData;
    }
}

// A single plot point used to reference the plot point in the graph
class PlotValue {
    constructor(id, value) {
        this.id = id;
        this.value = value;
    }
}