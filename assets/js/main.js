﻿// TODO:
// Add Loading state before async call finishes
// Reorganize how data for plotting is done
// Rework the plot function to support new data structure
// Make timeline plots prevent overlapping points
// Add a scale factor for data points to show multiple hits on the same car
// Add axis group labels?
// Add ability to display errors from airtable
// Add ability to save data to local storage and only retrieve from airtable once a day (prevents flooding airtable with a ton of requests)
// Add ability to color points based on different properties besides sort (color by line, color by type, by time, etc)
// Rework data intake to simplify format of data from airtable (merge down fields into the record so it is easier to sort the data later)
// Move point size to a global variable and gap size too, configure this to apply to the CSS as well

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
        graphPointsByLine();
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

function remapValue(value, low1, high1, low2, high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
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

function graphPointsByLine() {
    // TODO: CODE HERE
}
