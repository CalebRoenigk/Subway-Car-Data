// TODO: Code new plot data creation function

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
    let plotData = groupDataByField(allRecords, 'Number', 'Number');
    
    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Uses PlotData to set the postions and properties of each data point
//  - plotData: a PlotData object used to graph the plot
function updatePlot(plotData) {
    // First determine the plot method via plotType
    switch(plotData.plotType) {
        default:
        case 'Number':
            // Plot the data linearly
            linearPlot(plotData);
            break;
        case 'Groups':
            // TODO: MAKE GROUP GRAPHING WORK!!!!
            break;
        case 'Car Type':
            // Plot the data into sorted groups
            groupPlot(plotData);
            break;
        case 'Time':
            // Plot the data linearly
            fixedGroupPlot(plotData, 96);
            break;
    }

    // Update the data labels
    updateLabels(plotData);
}

// Graphs the data points in a linear fashion
//  - plotData: a PlotData object used to graph the plot
function linearPlot(plotData) {
    // Get the width of the graph area for the data points
    let graphArea = document.getElementById('graph-points-wrapper');
    let graphWidth = graphArea.offsetWidth;
    let graphHeight = graphArea.offsetHeight;
    let pointSize = document.getElementById(allRecords[0].id).offsetWidth;
    let additionalGap = 2;
    
    // Iterate over each plot group
    for(let i=0; i < plotData.plotGroups.length; i++) {
        let plotGroup = plotData.plotGroups[i];
        // Iterate over the data in each plot group
        for(let j=0; j < plotGroup.groupData.length; j++) {
            // Get the id of the data point
            let id = plotGroup.groupData[j].id;

            // Y pos will be the count within the group
            // X pos will be the groups position in the linear plot
            let xPercentage = Math.round(remapValue(plotGroup.groupData[j].value, plotData.minimum, plotData.maximum, 0, 100) * 10) / 10;
            let xPos = xPercentage + '%';
            let yPos = '50%';
            
            // TODO: Lets take a deeper dive on this code later because I think it still could be improved, its currently a bit 'messy' and also doesn't seem to account for intersections fully.
            // Fix overlaps here
            // Use the width of the graph area. Find the pixel position of the point based on the xPos above
            // Use the XPosition to determine if it intersects other previous points, adjust the Y position accordingly
            // Only run overlap check if we are past the first element
            if(i > 0) {
                let realXPosition = graphWidth * (xPercentage/100);
                let realYPosition = graphHeight * (50/100);
                let pointBounds = getPointBounds(pointSize, realXPosition, realYPosition);
                let previousPoint = document.getElementById(plotData.plotGroups[i-1].groupData[0].id);
                let previousYPercent = previousPoint.style.top.replace(/%/g, '')/100;
                let previousPointBounds = getPointBounds(pointSize, (previousPoint.style.left.replace(/%/g, '')/100) * graphWidth, previousYPercent * graphHeight);
                
                if(testBoundsIntersect(pointBounds, previousPointBounds)) {
                    yPos = ((previousYPercent - ((pointSize + additionalGap) / graphHeight))*100) + '%';
                }
            }
            
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

// Returns a bounds object given an input size and center location
//  - size: the square size of the point
//  - x: the center of the point on the X Axis
//  - y: the center of the point on the Y Axis
function getPointBounds(size, x, y) {
    return {
        top: y - (size/2),
        bottom: y + (size/2),
        left: x - (size/2),
        right: x + (size/2),
        width: size,
        height: size
    }
}

// Returns a boolean noting the intersection of two bounds given the bounds
//  - bounds1: the first point bounds
//  - bounds2: the second point bounds
function testBoundsIntersect(bounds1, bounds2) {
    return (
        bounds1.left < bounds2.right &&
        bounds1.right > bounds2.left &&
        bounds1.top < bounds2.bottom &&
        bounds1.bottom > bounds2.top
    );
}

// Sorts the graph by Car Type
function graphPointsByType() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Car Type', 'Car Type');

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Creates a grouping plot using plotData
//  - plotData: a PlotData object used to graph the plot
//  - pointSize: size of the points
//  - additionalGap: gap between the points in each group
//  - maxColumn: the most columns a group can have
function groupPlot(plotData, pointSize = 8, additionalGap = 2, maxColumn = 5) {
    let graphArea = document.getElementById('graph-points-wrapper');
    let graphWidth = graphArea.offsetWidth;

    let groupWidth = (graphWidth - (plotData.plotGroups.length * pointSize)) / (plotData.plotGroups.length-1);
    let columnCount = Math.min(Math.floor(groupWidth/(pointSize + additionalGap)), maxColumn);
    
    let maxGroupLength = getMaxGroupLength(plotData);
    let rowCount = Math.ceil(maxGroupLength / columnCount);
    
    for(let i=0; i < plotData.plotGroups.length; i++) {
        let groupData = plotData.plotGroups[i].groupData;
        let startingXPosition = groupWidth * i;
        let startingYPosition =  ((rowCount-1) * additionalGap)/2;
        for(let j = 0; j < groupData.length; j++) {
            let id = groupData[j].id;
            let xIndex = j % columnCount;
            let yIndex = Math.floor(j/columnCount);
            
            let xPos = xIndex * (pointSize + additionalGap);
            let yPos = yIndex * (pointSize + additionalGap);
            
            let point = document.getElementById(id);
            
            point.style.top = `calc(50% + ${startingYPosition - yPos}px)`;
            point.style.left = `calc(${(startingXPosition / graphWidth)*100}% + ${xPos}px`;
        }
    }
}

// Returns the largest group from a given plot data
//  - plotData: a PlotData object used to graph the plot
function getMaxGroupLength(plotData) {
    let maxGroupLength = plotData.plotGroups[0].groupData.length;
    plotData.plotGroups.forEach(group => {maxGroupLength = Math.max(group.groupData.length, maxGroupLength)});
    
    return maxGroupLength;
}

// Sorts the graph by Time of Day
function graphPointsByTime() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Ridden Date', 'Time', timeToInterval);

    // Sort by time
    plotData.plotGroups.sort((a, b) => a.groupName - b.groupName);
    
    console.log(plotData);

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Takes an input time and converts it to a 15-minute time interval index
//  - time: a UTC time value
function timeToInterval(time) {
    let intervalMinutes = 15;
    
    // Parse the "Ridden Date" field into a Date object
    let date = new Date(time);

    // Extract hours and minutes
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();

    // Calculate the total minutes from midnight
    let totalMinutes = hours * 60 + minutes;

    // Calculate the index of the interval (e.g., 0 for 00:00-00:15, 1 for 00:15-00:30, etc.)
    let intervalIndex = Math.floor(totalMinutes / intervalMinutes);
    
    return intervalIndex;
}

// Creates a grouping plot using plotData with a fixed set of groups
//  - plotData: a PlotData object used to graph the plot
//  - fixedGroupSize: the amount of groups to plan for
//  - pointSize: size of the points
//  - additionalGap: gap between the points in each group
function fixedGroupPlot(plotData, fixedGroupSize, pointSize = 8, additionalGap = 2) {
    let graphArea = document.getElementById('graph-points-wrapper');
    let graphWidth = graphArea.offsetWidth;

    let groupWidth = (graphWidth - (fixedGroupSize * pointSize)) / (fixedGroupSize-1);
    let columnCount = Math.floor(groupWidth/(pointSize + additionalGap));

    let maxGroupLength = getMaxGroupLength(plotData);
    let rowCount = Math.ceil(maxGroupLength / columnCount);

    for(let i=0; i < plotData.plotGroups.length; i++) {
        let groupData = plotData.plotGroups[i].groupData;
        let startingXPosition = groupWidth * i;
        let startingYPosition =  ((rowCount-1) * additionalGap)/2;
        for(let j = 0; j < groupData.length; j++) {
            let id = groupData[j].id;
            let xIndex = j % columnCount;
            let yIndex = Math.floor(j/columnCount);

            let xPos = xIndex * (pointSize + additionalGap);
            let yPos = yIndex * (pointSize + additionalGap);

            let point = document.getElementById(id);

            point.style.top = `calc(50% + ${startingYPosition - yPos}px)`;
            point.style.left = `calc(${(startingXPosition / graphWidth)*100}% + ${xPos}px`;
        }
    }
}