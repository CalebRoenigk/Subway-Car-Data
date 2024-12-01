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
    
    // TODO: Fix overlapping dots if any exist
    resolveOverlaps(plotData);

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

// Resolves overlapping points by offsetting the next point in the sequence by the height of the previous point, does this iteratively until all overlapping points have been resolved
//  - plotData: a PlotData object used to graph the plot
function resolveOverlaps(plotData, additionalGap = 0) {
    // Get an array of all plotted points as HTML elements
    let pointElements = getPointHtmlElements(plotData);
    
    // Iterate over each element
    // for(let i= 0; i < pointElements.length; i++) {
    //     let primaryElement = pointElements[i];
    //     // Iterate over each element after the current element
    //     for(let j= i+1; j < pointElements.length; j++) {
    //         let comparisonElement = pointElements[j];
    //        
    //         if(testBoundsIntersecting(primaryElement, comparisonElement)) {
    //             // Determine the amount of height to offset the element by
    //             let primaryElementHeight = primaryElement.getBoundingClientRect().height;
    //            
    //             // Get the current Y Position
    //             let currentComparisonYPosition = comparisonElement.style.top;
    //            
    //             // Calculate the new Y Position
    //             let newComparisonYPosition = `calc(${currentComparisonYPosition} - ${primaryElementHeight + additionalGap}px)`;
    //            
    //             // Assign the new Y Position style
    //             comparisonElement.style.top = newComparisonYPosition;
    //            
    //             // TODO: If this doesn't work, instead keep an attr to keep track of the offset height and use that to calc a new height offset each time, vs using this nested approach
    //         }
    //     }
    // }

    iterativeOverlapFix(pointElements, additionalGap = 0);
}

function iterativeOverlapFix(pointElements, additionalGap = 0, iterationsCount = 0) {
    if(iterationsCount > 100) {
        return;
    }
    
    for(let i=0; i < pointElements.length-2;) {
        let primaryElement = pointElements[i];
        let comparisonElement = pointElements[i+1];
        
        // Test if the two elements overlap
        if(testBoundsIntersecting(primaryElement, comparisonElement)) {
            // Set the new position of the comparision element
            comparisonElement.style.top = `calc(${primaryElement.style.top} - ${primaryElement.getBoundingClientRect().height + additionalGap})`;
        }
        
        i += 2;
    }
    
    // Test if any elements overlap
    let overlapsExist = false;
    for(let i= 0; i < pointElements.length; i++) {
        let primaryElement = pointElements[i];
        // Iterate over each element after the current element
        for(let j= i+1; j < pointElements.length; j++) {
            let comparisonElement = pointElements[j];

            if(testBoundsIntersecting(primaryElement, comparisonElement)) {
                overlapsExist = true;
            }
        }
    }
    
    if(overlapsExist) {
        iterativeOverlapFix(pointElements, additionalGap, iterationsCount+1);
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

// Tests if two HTML elements intersect one-another
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