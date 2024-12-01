﻿// TODO: Code new plot data creation function

// Takes in data and groups the data by specified field, with optional preprocessing done prior to grouping
// Arguments:
//  - data: the data to group
//  - field: the field in the data to group by (for now I can't figure out how to go multiple levels deep so I am just gonna manually assume we always go .fields before grouping by the key) TODO: Try some ways to figure this out?
//  - plotType: the type of plot for the data (either a group plot or a timeline plot
//  - preprocessFunction: an optional function to be used on the field prior to grouping the data, used to modify/simplify fields into groupable data
function groupDataByField(data, field, plotType, preprocessFunction = null) {
    // Create the group array
    let plotGroups = [];
    
    data.forEach(record => {
        let fieldValue = record.fields[field];
        // Process the key before grouping if there is a preprocessFunction
        fieldValue = preprocessFunction ? preprocessFunction(fieldValue) : fieldValue;
        
        let plotValue = new PlotValue(record.id, fieldValue);
        
        // Check if there is any plot group that matches the current fieldValue
        let plotGroupIndex = plotGroups.findIndex(group => group.groupName === fieldValue);
        if(plotGroupIndex != -1) {
            // There is already an existing plotGroup with the same fieldValue
            // Add this record to the plotGroup
            plotGroups[plotGroupIndex].groupData.push(plotValue);
            
        } else {
            // Create a new plot group
            let plotGroup = new PlotGroup(fieldValue, [plotValue])

            plotGroups.push(plotGroup);
        }
    });

    // Create the plot data object
    let plotData = new PlotData(plotType, plotGroups);
    
    // Return the plot data
    return plotData;
}

// Sorts the graph by Car Number
function graphPointsByNumber() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Number', 'Timeline');
    
    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Uses PlotData to set the postions and properties of each data point
//  - plotData: a PlotData object used to graph the plot
function updatePlot(plotData) {
    // First determine the plot method via plotType
    switch(plotData.plotType) {
        default:
        case 'Timeline':
            // Plot the data linearly
            linearPlot(plotData);
            break;
        case 'Groups':
            break;
    }
    
    // TODO: Fix overlapping dots if any exist

    // Update the data labels
    updateLabels(plotData);
}

// Graphs the data points in a linear fashion
//  - plotData: a PlotData object used to graph the plot
function linearPlot(plotData) {
    // Iterate over each plot group
    for(let i=0; i < plotData.plotGroups.length; i++) {
        let plotGroup = plotData.plotGroups[i];
        // Iterate over the data in each plot group
        for(let j=0; j < plotGroup.groupData.length; j++) {
            // Get the id of the data point
            let id = plotGroup.groupData[j].id;

            // Y pos will be the count within the group
            // X pos will be the groups position in the linear plot
            let xPos = (Math.round(remapValue(plotGroup.groupData[j].value, plotData.minimum, plotData.maximum, 0, 100) * 10) / 10) + '%';
            let yPos = '50%';

            // Set the styles of the point
            let point = document.getElementById(id);
            point.style.top = yPos;
            point.style.left = xPos;
        }
    }
}

// Updates the data labels for the plot
//  - plotData: a PlotData object used to graph the plot
function updateLabels(plotData) {
    // TODO: Refactor this to support a variable number of labels
    let axisMin = document.getElementById('axis-minimum');
    axisMin.textContent = plotData.minimum;

    let axisMax = document.getElementById('axis-maximum');
    axisMax.textContent = plotData.maximum;
}

// Test function to determine if two points overlap
function testOverlaps() {
    // Record 1 and 2 bounds
    let record1Point = document.getElementById(allRecords[0].id);
    let record1Bounds = record1Point.getBoundingClientRect();
    console.log(record1Point, `Top-Left: (${record1Bounds.left},${record1Bounds.top}) | Bottom-Right: (${record1Bounds.left + record1Bounds.width},${record1Bounds.top + record1Bounds.height})`);

    let record2Point = document.getElementById(allRecords[1].id);
    let record2Bounds = record2Point.getBoundingClientRect();
    console.log(record2Point, `Top-Left: (${record2Bounds.left},${record2Bounds.top}) | Bottom-Right: (${record2Bounds.left + record2Bounds.width},${record2Bounds.top + record2Bounds.height})`);
    
    console.log(`Do Points Intersect: ${testBoundsIntersecting(record1Bounds, record2Bounds)}`);
}

// Tests if two clientBoundingRects intersect one-another
//  - rect1: clientBoundingRect #1
//  - rect2: clientBoundingRect #2
function testBoundsIntersecting(rect1, rect2) {
    return (
        rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top
    );
}