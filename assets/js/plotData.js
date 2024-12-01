// TODO: CODE HERE
// This class is purely used to hold data to be used in a plot

// The main data object for a plot
class PlotData {
    constructor(plotType, plotGroups) {
        this.plotType = plotType;
        this.plotGroups = plotGroups;
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