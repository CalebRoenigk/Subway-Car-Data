// ---------------------------- //
// ----- Global Variables ----- //
// ---------------------------- //

const pointSize = 10;
const additionalGap = 2;

// -------------------------- //
// ----- Sort Functions ----- //
// -------------------------- //

// Sorts the graph by Car Number
function graphPointsByNumber() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Number', 'Number');

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Sorts the graph by Car Type
function graphPointsByType() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Car Type', 'Car Type');

    // Sort by type
    // TODO: Maybe we move this into its own function?
    plotData.plotGroups.sort((a, b) => {
        // Extract the numeric part after "R" from the groupName
        const numA = parseInt(a.groupName.slice(1));
        const numB = parseInt(b.groupName.slice(1));

        // Compare the extracted numbers
        return numA - numB;
    });

    // TODO: Fix this, it doesnt seem to quite work
    // Sort by line within groups
    plotData.plotGroups.forEach(group => {
        group.groupData.sort((itemA, itemB) => {
            const lineA = allRecords.find(record => record.id === itemA.id).fields['Line'] || 0; // Default to 0 if Line is undefined
            const lineB = allRecords.find(record => record.id === itemB.id).fields['Line'] || 0; // Default to 0 if Line is undefined
            return lineA - lineB;
        });
    });

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Sorts the graph by Time of Day
function graphPointsByTime() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Ridden Date', 'Time', timeToInterval);

    // Sort by time
    plotData.plotGroups.sort((a, b) => a.groupName - b.groupName);

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Sorts the graph by Day of Year
function graphPointsByDate() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Ridden Date', 'Day', dateToInterval);

    // Sort by time
    plotData.plotGroups.sort((a, b) => a.groupName - b.groupName);

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// Sorts the graph by Line
function graphPointsByLine() {
    // Create the plot data
    let plotData = groupDataByField(allRecords, 'Line', 'Line');
    
    // Sort by line
    plotData.plotGroups.sort((a, b) => {
        const groupNameA = a.groupName;
        const groupNameB = b.groupName;

        // Check if both groupNames are numeric
        const isANumeric = !isNaN(groupNameA);
        const isBNumeric = !isNaN(groupNameB);

        if (isANumeric && isBNumeric) {
            // Compare as numbers if both are numeric
            return parseInt(groupNameA) - parseInt(groupNameB);
        } else if (isANumeric) {
            // Numeric comes after alphabetic
            return 1;
        } else if (isBNumeric) {
            // Alphabetic comes before numeric
            return -1;
        } else {
            // Compare alphabetically if both are alphabetic
            return groupNameA.localeCompare(groupNameB);
        }
    });
    console.log(plotData);

    // Update the data points with new positions and styles
    updatePlot(plotData);
}

// -------------------------- //
// ----- Plot Functions ----- //
// -------------------------- //

// Uses PlotData to set the positions and properties of each data point
//  - plotData: a PlotData object used to graph the plot
function updatePlot(plotData) {
    // First determine the plot method via plotType
    switch(plotData.plotType) {
        default:
        case 'Number':
            // Plot the data linearly
            linearPlot(plotData);
            break;
        case 'Car Type':
            // Plot the data into sorted groups
            groupPlot(plotData);
            break;
        case 'Time':
            // Plot the data linearly
            fixedGroupPlot(plotData, 96);
            break;
        case 'Day':
            // Plot the data linearly
            fixedGroupPlot(plotData, 122);
            break;
        case 'Line':
            // Plot the data linearly
            singleGroupPlot(plotData);
            break;
    }

    // Update the data labels
    updateLabels(plotData);
}

// Graphs the data points in a linear fashion
//  - plotData: a PlotData object used to graph the plot
function linearPlot(plotData) {
    // Get the width of the graph area
    let graphArea = document.getElementById('graph-points-wrapper');
    let graphWidth = graphArea.offsetWidth;
    
    // Get the max amount of points that can be displayed (the point interval)
    let columnCount =  Math.floor((graphWidth + additionalGap) / (pointSize + additionalGap));
    
    // TODO: Mostly working but seems to be a bit off screen
    let columnStacks = [];
    for(let i=0; i < plotData.plotGroups.length; i++) {
        // Get the id of the data point
        let data = plotData.plotGroups[i].groupData[0];
        let id = data.id;
        let number = data.value;
        
        // Get the column the value is meant to be in
        let xIndex = Math.floor(number/columnCount);
        let yIndex = 0;
        let columnStackIndex = columnStacks.findIndex(stack => stack.index === xIndex);
        if(columnStackIndex !== -1) {
            // The stack exists already, add one to the stack and use this as your yIndex
            columnStacks[columnStackIndex].count++;
            yIndex = columnStacks[columnStackIndex].count;
        } else {
            columnStacks.push({index: xIndex, count: 0});
        }
        
        let xPos = (xIndex * pointSize) + (Math.max(xIndex-1, 0) * additionalGap);
        let yPos = (yIndex * pointSize) + (Math.max(yIndex-1, 0) * additionalGap);
        
        xPos = `${(xPos / graphWidth) * 100}%`;
        yPos = `calc(50% - ${yPos}px)`;

        // Set the styles of the point
        let point = document.getElementById(id);
        point.style.top = yPos;
        point.style.left = xPos;
    }
}

// Creates a grouping plot using plotData
//  - plotData: a PlotData object used to graph the plot
//  - maxColumn: the most columns a group can have
function groupPlot(plotData, maxColumn = 5) {
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

// Creates a grouping plot using plotData with a fixed set of groups
//  - plotData: a PlotData object used to graph the plot
//  - fixedGroupSize: the amount of groups to plan for
function fixedGroupPlot(plotData, fixedGroupSize) {
    let graphArea = document.getElementById('graph-points-wrapper');
    let graphWidth = graphArea.offsetWidth;

    let groupWidth = graphWidth / (fixedGroupSize-1);
    let columnCount = Math.max(Math.floor(groupWidth/(pointSize + additionalGap)), 1);

    let maxGroupLength = getMaxGroupLength(plotData);
    let rowCount = Math.ceil(maxGroupLength / columnCount);

    // console.log(`Col: ${columnCount} | Row: ${rowCount} | Group Width: ${groupWidth} | Calc Col: ${Math.floor(groupWidth/(pointSize + additionalGap))}`);

    for(let i=0; i < plotData.plotGroups.length; i++) {
        let groupData = plotData.plotGroups[i].groupData;
        let startingXPosition = groupWidth * plotData.plotGroups[i].groupName;
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

// Graphs the data points in one large group
//  - plotData: a PlotData object used to graph the plot
function singleGroupPlot(plotData) {
    // Get the total count of all items in the plot (records)
    let totalRecords = plotData.getRecordCount();
    
    // Determine the square root of the value
    let columnCount = Math.ceil(Math.sqrt(totalRecords));
    
    // Determine the top left starting position
    let startingXPosition = -(((pointSize * columnCount) + (additionalGap * (columnCount-1)))/2);
    let startingYPosition = -(((pointSize * columnCount) + (additionalGap * (columnCount-1)))/2);
    
    let plotIndex = 0;
    for(let i=0; i < plotData.plotGroups.length; i++) {
        let plotGroup = plotData.plotGroups[i].groupData;
        for(let j=0; j < plotGroup.length; j++) {
            let id = plotGroup[j].id;
            let xIndex = plotIndex % columnCount;
            let yIndex = Math.floor(plotIndex / columnCount);

            let xPos = xIndex * (pointSize + additionalGap);
            let yPos = yIndex * (pointSize + additionalGap);

            let point = document.getElementById(id);

            point.style.top = `calc(50% + ${startingYPosition + yPos}px)`;
            point.style.left = `calc(50% + ${startingXPosition + xPos}px)`;
            
            plotIndex++;
        }
    }
}

// -------------------------------------- //
// ----- Field Preprocess Functions ----- //
// -------------------------------------- //

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

// Takes an input time and converts it to a day of the year interval index
//  - time: a UTC time value
function dateToInterval(time) {
    let intervalDays = 3;

    // Parse the input into a Date object
    let parsedDate = new Date(time);

    // Get the start of the year for the given date
    let startOfYear = new Date(parsedDate.getUTCFullYear(), 0, 1);

    // Calculate the difference in milliseconds between the input date and the start of the year
    let diffInMillis = parsedDate - startOfYear;

    // Convert the difference into days (1 day = 86400000 milliseconds)
    let dayIndex = Math.floor(diffInMillis / (1000 * 60 * 60 * 24));

    // Calculate the index of the interval
    let intervalIndex = Math.floor(dayIndex / intervalDays);

    return intervalIndex;
}

// ----------------------------- //
// ----- Data Manipulation ----- //
// ----------------------------- //

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

// Returns the largest group from a given plot data
//  - plotData: a PlotData object used to graph the plot
function getMaxGroupLength(plotData) {
    let maxGroupLength = plotData.plotGroups[0].groupData.length;
    plotData.plotGroups.forEach(group => {maxGroupLength = Math.max(group.groupData.length, maxGroupLength)});
    
    return maxGroupLength;
}

// ---------------------------- //
// ----- Visual Functions ----- //
// ---------------------------- //

// Updates the data labels for the plot
//  - plotData: a PlotData object used to graph the plot
function updateLabels(plotData) {
    // TODO: Refactor this to support a variable number of labels
    let axisMin = document.getElementById('axis-minimum');
    axisMin.textContent = plotData.minimum;

    let axisMax = document.getElementById('axis-maximum');
    axisMax.textContent = plotData.maximum;
}