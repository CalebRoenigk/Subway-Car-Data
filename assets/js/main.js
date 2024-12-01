// TODO:
// Add Loading state before async call finishes
// Reorganize how data for plotting is done
// Rework the plot function to support new data structure
// Make timeline plots prevent overlapping points
// Add a scale factor for data points to show muitliple hits on the same car
// Add axis group labels?
// Add ability to display errors from airtable

const airtableToken = "patRdIU76X8UpDiKK.e9bad724a70bf0e4b8fcb9e7d26d89e86c759a4667becad08e07d56406a14562";
const table = "Subway Car Ridership";

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: airtableToken
});
var base = Airtable.base('appB6vHrDyR6I0t4a');
const allRecords = [];

// Function to fetch all records
async function fetchAllRecords() {
    try {
        await base(table)
            .select({
                view: 'Grid view', // Specify the view if needed
                pageSize: 100,     // Fetch up to 100 records per page
            })
            .eachPage((records, fetchNextPage) => {
                // Add fetched records to the array
                allRecords.push(...records);
                // Fetch the next page
                fetchNextPage();
            });

        /* console.log(allRecords[0]); */
        generateDataPoints();
        graphPointsByNumber();
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}

// Run the function
fetchAllRecords();

function generateDataPoints() {
    allRecords.sort((a, b) => a.fields['Number'] - b.fields['Number']);

    for(let i=0; i < allRecords.length; i++) {
        let dataObject = allRecords[i].fields;
        let dataID = allRecords[i].id;

        generatePoint(dataID, dataObject['Line'], i);
    }
}

function generatePoint(id, line, i) {
    let point = document.createElement("div");

    // Add content to the div (optional)
    point.id = id;
    point.classList.add('data-point');
    point.style.position = 'absolute';
    point.style.transitionDelay = i * 0.005 + 's';
    point.classList.add(getPointColor(line));

    createTooltip(point, id);

    // Add the div to the DOM (e.g., to the body)
    document.getElementById("graph-points-wrapper").appendChild(point);
}

function createTooltip(point, id) {
    let tooltipWrapper = document.createElement("div");
    tooltipWrapper.classList.add('tool-tip-wrapper');

    let tooltip = document.createElement("div");

    let pointData = allRecords.find((data) => data.id === id);

    let number = pointData.fields['Number'];
    let type = pointData.fields['Car Type'];
    let line = pointData.fields['Line'];

    let numberTitle = document.createElement("h3");
    numberTitle.innerHTML = number;

    let typeTitle = document.createElement("h4");
    typeTitle.innerHTML = type;
    let lineTitle = document.createElement("h4");
    lineTitle.innerHTML = line;

    let typeLineGroup = document.createElement("div");
    typeLineGroup.appendChild(typeTitle);
    typeLineGroup.appendChild(lineTitle);

    typeLineGroup.classList.add('card-group');

    tooltip.appendChild(numberTitle);
    tooltip.appendChild(typeLineGroup);

    // Add content to the div (optional)
    tooltip.classList.add('tool-tip');

    let tooltipPointOutline = document.createElement("div");
    tooltipPointOutline.classList.add('tool-tip-point-outline');


    // Add the div to the DOM (e.g., to the body)
    tooltipWrapper.appendChild(tooltip);
    tooltipWrapper.appendChild(tooltipPointOutline);

    point.appendChild(tooltipWrapper);
}

function getPointColor(line) {
    switch(line) {
        case 'A':
        case 'C':
        case 'E':
            return 'blue-line';
        case 'B':
        case 'D':
        case 'F':
        case 'M':
            return 'orange-line';
        case 'G':
            return 'lime-line';
        case 'L':
            return 'light-gray-line';
        case 'J':
        case 'Z':
            return 'brown-line';
        case 'N':
        case 'Q':
        case 'R':
        case 'W':
            return 'yellow-line';
        case '1':
        case '2':
        case '3':
            return 'red-line';
        case '4':
        case '5':
        case '6':
            return 'green-line';
        case '7':
            return 'purple-line';
        case 'T':
            return 'turquoise-line';
        case 'S':
        default:
            return 'gray-line';
    }
}


// END MAIN - TODO: REFACTOR AND REMOVE ANY FUNCTIONALITY THAT ISNT NEEDED IN MAIN TO OTHER JS FILES

function setMinMaxLabels(minMax) {
    let axisMin = document.getElementById('axis-minimum');
    axisMin.textContent = minMax.minField;

    let axisMax = document.getElementById('axis-maximum');
    axisMax.textContent = minMax.maxField;
}

function getMinMax(field) {
    let minField = 0;
    let maxField = 0;
    for(let i=0; i < allRecords.length; i++) {
        let data = allRecords[i].fields;
        let value = data[field];

        if(i === 0) {
            minField = value;
            maxField = value;
        } else {
            if(value < minField) {
                minField = value;
            }
            if(value > maxField) {
                maxField = value;
            }
        }
    }

    let minMax = {
        'minField': minField,
        'maxField': maxField
    };

    return minMax;
}

function remapValue(value, low1, high1, low2, high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

function graphPointsByType() {
    let groupedData = groupByProperty('Car Type');

    for(let i=0; i < groupedData.length; i++) {
        for(let j=0; j < groupedData[i].length; j++) {
            let id = groupedData[i][j].id;
            let type = groupedData[i][j].fields['Car Type'];

            let xPos = (Math.round(remapValue(i, 0, groupedData.length-1, 0, 100)*10)/10) + '%';
            let yPos = 'calc(50% - calc(10px * ' + j + '))';

            let point = document.getElementById(id);
            point.style.top = yPos;
            point.style.left = xPos;
        }
    }

    setMinMaxLabels(minMax);
}

function groupByProperty(property) {
    const grouped = {};

    // Iterate over the array and group objects by the property value
    allRecords.forEach(item => {
        const key = item.fields[property];
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });

    // Convert the grouped object into an array of arrays
    return Object.values(grouped);
}

function groupByDate() {
    const grouped = {};

    // Iterate over the array and group objects by the property value
    allRecords.forEach(item => {
        const key = getDateAsYearValue(item.fields['Ridden Date']);
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });

    // Convert the grouped object into an array of arrays
    return Object.values(grouped);
}

function graphPointsByDate() {
    let minMax = getMinMaxDate();

    // Iterate over the grouped records
    let groupedByDate = groupByDate();

    for(let i=0; i < groupedByDate.length; i++) {
        for(let j=0; j < groupedByDate[i].length; j++) {
            let id = groupedByDate[i][j].id;
            let date = getDateAsYearValue(groupedByDate[i][j].fields['Ridden Date']);

            let xPos = (Math.round(remapValue(date, minMax.minField, minMax.maxField, 0, 100)*10)/10) + '%';
            let yPos = 'calc(50% - calc(10px * ' + j + '))';

            let point = document.getElementById(id);
            point.style.top = yPos;
            point.style.left = xPos;
        }
    }

    setMinMaxLabels(minMax);
}

function getDateAsYearValue(dateString) {
    // Create a Date object from the input string
    const date = new Date(dateString);

    // Create a Date object for the start of the year
    const startOfYear = new Date(date.getFullYear(), 0, 0); // January 1, 00:00

    // Calculate the difference in milliseconds
    const diff = date - startOfYear;

    // Convert the difference to days (milliseconds per day)
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    let year = date.getFullYear();

    let dateAsYearValue = year * 365 + dayOfYear;

    return dateAsYearValue;
}

function getMinMaxDate() {
    let minField = 0;
    let maxField = 0;
    for(let i=0; i < allRecords.length; i++) {
        let data = allRecords[i].fields;
        let value = getDateAsYearValue(data['Ridden Date']);

        if(i === 0) {
            minField = value;
            maxField = value;
        } else {
            if(value < minField) {
                minField = value;
            }
            if(value > maxField) {
                maxField = value;
            }
        }
    }

    let minMax = {
        'minField': minField,
        'maxField': maxField
    };

    return minMax;
}

function graphPointsByTime() {
    let timeInterval = 15;
    let minMax = {
        'minField': 0,
        'maxField': Math.ceil(1440/timeInterval)
    };

    // Iterate over the grouped records
    let groupedByTimeInterval = groupByTimeIntervals(timeInterval);

    for(let i=0; i < groupedByTimeInterval.length; i++) {
        for(let j=0; j < groupedByTimeInterval[i].length; j++) {
            let id = groupedByTimeInterval[i][j].id;
            let timeGroup = i;

            let xPos = (Math.round(remapValue(i, minMax.minField, minMax.maxField, 0, 100)*10)/10) + '%';
            let yPos = 'calc(50% - calc(10px * ' + j + '))';

            let point = document.getElementById(id);
            point.style.top = yPos;
            point.style.left = xPos;
        }
    }

    minMax.minField = '12AM';
    minMax.maxField = '12AM';

    setMinMaxLabels(minMax);
}

function groupByTimeIntervals(intervalMinutes = 15) {
    const grouped = [];

    allRecords.forEach(item => {
        // Parse the "Ridden Date" field into a Date object
        const date = new Date(item.fields["Ridden Date"]);

        // Extract hours and minutes
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();

        // Calculate the total minutes from midnight
        const totalMinutes = hours * 60 + minutes;

        // Calculate the index of the interval (e.g., 0 for 00:00-00:15, 1 for 00:15-00:30, etc.)
        const intervalIndex = Math.floor(totalMinutes / intervalMinutes);

        // Ensure the array has enough subarrays to store the group at the correct index
        while (grouped.length <= intervalIndex) {
            grouped.push([]);
        }

        // Add the item to the corresponding interval group
        grouped[intervalIndex].push(item);
    });

    return grouped;
}

function graphPointsByLine() {
    // TODO: CODE HERE
}
