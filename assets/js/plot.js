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
    
    // Fix overlapping dots if any exist
    resolveOverlaps(plotData, 2);

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

// Resolves overlapping points by offsetting the next point in the sequence by the height of the previous point, does this iteratively until all overlapping points have been resolved
//  - plotData: a PlotData object used to graph the plot
function resolveOverlaps(plotData, additionalGap = 0) {
    console.log("Resolving Overlaps");
    // TODO: This does not seem to work quite right but after playing with it for a bit I think I need to really dive deeper to figure out why it doesn't work and fix it, so for now I am leaving it but please refactor later!
    // TODO: Another issue with this approach is that using getClientRect returns the client rect at the moment of request, the issue here is that we are using transitions to move the points so the rects arent accurate. Instead we need a way to calculate the resting position of the point and determine its Y position accordingly
    
    // Get an array of all plotted points as HTML elements
    let pointElements = getPointHtmlElements(plotData);
    
    // Iterate over each element
    for(let i= 0; i < pointElements.length; i++) {
        let primaryElement = pointElements[i];
        // Iterate over each element after the current element
        for(let j= i+1; j < pointElements.length; j++) {
            let comparisonElement = pointElements[j];
            
            if(testBoundsIntersecting(primaryElement, comparisonElement)) {
                // Determine the amount of height to offset the element by
                let primaryElementHeight = primaryElement.getBoundingClientRect().height;

                // Get the current Y Position
                let currentComparisonYPosition = comparisonElement.style.top;

                // Calculate the new Y Position
                let newComparisonYPosition = `calc(${currentComparisonYPosition} - ${primaryElementHeight + additionalGap}px)`;

                // Assign the new Y Position style
                comparisonElement.style.top = newComparisonYPosition;
            }
        }
    }
}

// Returns an array of plotted points as HTML elements
//  - plotData: a PlotData object used to graph the plot
function getPointHtmlElements(plotData) {
    let pointElements = [];
    plotData.plotGroups.forEach(plotGroup => {
        let groupElement = document.getElementById(plotGroup.groupData[0].id);
        pointElements.push(groupElement);
    });
    
    return pointElements;
}

// Tests if two HTML elements intersect one-another and returns a boolean
//  - element1: the primary comparison element
//  - element2: the second element to check for intersections with the first element
function testBoundsIntersecting(element1, element2) {
    let rect1 = element1.getBoundingClientRect();
    let rect2 = element2.getBoundingClientRect();
    
    return (
        rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top
    );
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
function testBoundsIntersect(bounds1, bounds2) {
    return (
        bounds1.left < bounds2.right &&
        bounds1.right > bounds2.left &&
        bounds1.top < bounds2.bottom &&
        bounds1.bottom > bounds2.top
    );
}