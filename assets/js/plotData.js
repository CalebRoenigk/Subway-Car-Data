// TODO: CODE HERE
// This class is purely used to hold data to be used in a plot

// The main data object for a plot
class PlotData {
    constructor(plotType, plotGroups) {
        this.plotType = plotType;
        this.plotGroups = plotGroups;
    }
}

// A group of data that appears in a plot
class PlotGroup {
    constructor(groupName, groupData) {
        this.groupName = groupName;
        this.groupData = groupData;
    }
}