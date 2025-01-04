// Configuration for generating PDF reports based on CSV input
const config = {
    companyName: localStorage.getItem("companyName") || '',
    locations: {
        "AMR": {
            name: "Al Mariah",
            rates: createRates(20.00, 17.00, 14.00, 2.00, 2.00, 2.00),
            records: []
        },
        "ALNAZR": {
            name: "Al Nazr",
            rates: createRates(20.00, 17.00, 14.00, 2.00, 2.00, 2.00),
            records: [],
            tableConfigOverride: createTableConfigOverridesALNAZR()
        }
    },
    tableConfig: createTableConfig()
};

function createRates(seniorManday, juniorManday, labourManday, seniorParcel, juniorParcel, labourParcel) {
    return {
        seniorMandayRate: seniorManday, juniorMandayRate: juniorManday, labourMandayRate: labourManday,
        seniorParcelRate: seniorParcel, juniorParcelRate: juniorParcel, labourParcelRate: labourParcel
    };
}

function createTableConfigOverridesALNAZR() {
    return {
        columns: [
            createColumn(6, 'Parcel Count Breakfast', record => record.parcelCount.breakfast, true),
            createColumn(7, 'Parcel Count Lunch', record => record.parcelCount.lunch, true),
            createColumn(8, 'Parcel Count Dinner', record => record.parcelCount.dinner, true),
            createColumn(9, 'Total Parcel Count', record =>
                record.parcelCount.breakfast + record.parcelCount.lunch + record.parcelCount.dinner, true)
        ]
    };
}

function createTableConfig() {
    return {
        columns: [
            createColumn(0, 'Date', record => formatDate(record.date)),
            createColumn(1, 'Day', record => getDayOfWeek(record.date)),
            createColumn(2, 'Seniors', record => record.manDays.senior, true),
            createColumn(3, 'Juniors', record => record.manDays.junior, true),
            createColumn(4, 'Labours', record => record.manDays.labour, true),
            createColumn(5, 'Total Mandays', record => record.manDays.senior + record.manDays.junior + record.manDays.labour, true),
            createColumn(6, 'Parcel Count Seniors', record => record.parcelCount.senior, true),
            createColumn(7, 'Parcel Count Juniors', record => record.parcelCount.junior, true),
            createColumn(8, 'Parcel Count Labours', record => record.parcelCount.labour, true),
            createColumn(9, 'Total Parcel Count', record => record.parcelCount.senior + record.parcelCount.junior + record.parcelCount.labour, true),
            createColumn(10, 'Consumption', record => formatNumber(record.consumption), true, { align: 'right' }),
            createColumn(11, 'Total Revenue', calculateAndFormatTotalRevenue, true, { align: 'right' }),
            createColumn(12, 'Cost/Manday', calculateCostPerManday),
            createColumn(13, 'Cost%', calculateCostPercentage)
        ]
    };
}

function createColumn(pos, label, valueFunc, calculateTotal = false, style = {}) {
    return { pos, label, value: valueFunc, calculateTotal, style };
}

function calculateAndFormatTotalRevenue(record, locationKey) {
    const revenue = calculateTotalRevenue(record, locationKey);
    return formatNumber(revenue);
}

function calculateTotalRevenue(record, locationKey) {
    const rates = config.locations[locationKey].rates;
    const revenue = (record.manDays.senior * rates.seniorMandayRate) +
        (record.manDays.junior * rates.juniorMandayRate) +
        (record.manDays.labour * rates.labourMandayRate) +
        (record.parcelCount.senior * rates.seniorParcelRate) +
        (record.parcelCount.junior * rates.juniorParcelRate) +
        (record.parcelCount.labour * rates.labourParcelRate) -
        (2 * (record.manDays.senior + record.manDays.junior + record.manDays.labour));
    return parseFloat(revenue).toFixed(2);
}

function calculateCostPerManday(record) {
    const totalMandays = record.manDays.senior + record.manDays.junior + record.manDays.labour;
    return totalMandays > 0 ? (record.consumption / totalMandays).toFixed(2) : '0.00';
}

function calculateCostPercentage(record, locationKey) {
    const revenue = calculateTotalRevenue(record, locationKey);
    return revenue > 0 ? ((record.consumption * 100) / revenue).toFixed(2) : '0.00';
}

if (config.companyName) {
    document.getElementById('companyName').value = config.companyName;
}

function processFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please upload a CSV file.');
        return;
    }

    const companyNameInput = document.getElementById('companyName');
    if (!companyNameInput.value.trim()) {
        alert('Enter company name.');
        return;
    }
    localStorage.setItem("companyName", companyNameInput.value.trim());
    config.companyName = companyNameInput.value.trim();

    readFile(file, data => {
        try {
            const parsedData = parseCSV(data);
            organizeData(parsedData);
            generatePDF(findLocationWithRecords());
        } catch (error) {
            console.error('Error processing CSV:', error);
            alert(`There was an error processing the CSV file: ${error.message}`);
        }
    });
}

function readFile(file, callback) {
    const reader = new FileReader();
    reader.onload = event => callback(event.target.result);
    reader.onerror = () => alert('Failed to read file.');
    reader.readAsBinaryString(file);
}

function parseCSV(csvData) {
    const workbook = XLSX.read(csvData, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function organizeData(parsedData) {
    parsedData.forEach(row => {
        const locationKey = row['CF.DCR#'].split('/')[1];
        const record = createRecordFromRow(row);
        config.locations[locationKey].records.push(record);
    });

    Object.keys(config.locations).forEach(location => {
        config.locations[location].records.sort((a, b) => a.date - b.date);
    });
}

function createRecordFromRow(row) {
    return {
        date: !isNaN(row['CF.Date']) ? excelSerialToDate(row['CF.Date']) : null,
        manDays: {
            senior: parseInt(row['CF.Mandays - Senior']) || 0,
            junior: parseInt(row['CF.Mandays - Junior']) || 0,
            labour: parseInt(row['CF.Mandays - Labour']) || 0
        },
        parcelCount: {
            senior: parseInt(row['CF.Parcel Count - Senior']) || 0,
            junior: parseInt(row['CF.Parcel Count - Junior']) || 0,
            labour: parseInt(row['CF.Parcel Count - Labour']) || 0,
            breakfast: parseInt(row['CF.Parcel Count - Breakfast']) || 0,
            lunch: parseInt(row['CF.Parcel Count - Lunch']) || 0,
            dinner: parseInt(row['CF.Parcel Count - Dinner']) || 0
        },
        transferIn: parseFloat(row['CF.Transfer In'] || 0),
        transferOut: parseFloat(row['CF.Transfer Out'] || 0),
        purchase: parseFloat(row['CF.Purchase'] || 0),
        purchaseReturn: parseFloat(row['CF.Purchase Return'] || 0),
        consumption: parseFloat(row['CF.Consumption'] || 0),
        openingStock: parseFloat(row['CF.Opening Stock'] || 0),
        closingStock: parseFloat(row['CF.Closing Stock'] || 0)
    };
}

function findLocationWithRecords() {
    return Object.keys(config.locations).find(key => config.locations[key].records.length > 0);
}

// Helper function to convert Excel serial date to JavaScript date
function excelSerialToDate(serial) {
    const excelEpoch = new Date(1899, 11, 30); // Excel starts counting dates from 1899-12-30
    const jsDate = new Date(excelEpoch.getTime() + serial * 86400000); // Add days in milliseconds
    return jsDate;
}

// Helper function to calculate the day of the week
function getDayOfWeek(date) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getUTCDay()];
}

// Function to format a JavaScript date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseFormattedNumber(numStr) {
    console.log('numStr ', numStr);
    // Remove commas and other non-numeric characters except for the decimal point and negative sign
    const cleanNumStr = String(numStr).replace(/[^0-9.-]+/g, '');
    return parseFloat(cleanNumStr);
}

function generatePDF(locationKey) {
    const locationConfig = config.locations[locationKey];
    const records = locationConfig.records;
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF('landscape');
    setupPDFHeader(doc, locationConfig.name);
    addStockTable(doc, records);
    addMainTable(doc, locationKey, records);
    finalizePDF(doc, locationConfig.name);
}

function setupPDFHeader(doc, locationName) {
    doc.setFontSize(18);
    doc.text(config.companyName, 14, 15);
    doc.setFontSize(14);
    doc.text(`Daily Consumption Report - ${locationName}`, 14, 25);
}

function addStockTable(doc, records) {
    const openingStock = records[0]?.openingStock || 0;
    const totalTransferIn = records.reduce((sum, record) => sum + (record.transferIn || 0), 0);
    const totalPurchase = records.reduce((sum, record) => sum + (record.purchase || 0), 0);
    const closingStock = records[records.length - 1]?.closingStock || 0;

    const actualConsumption = openingStock + totalTransferIn + totalPurchase - closingStock;
    const consumptionAsPerDCR = records.reduce((sum, record) => sum + (record.consumption || 0), 0);
    const variance = actualConsumption - consumptionAsPerDCR;
    const variancePercentage = (variance / consumptionAsPerDCR) * 100;

    const stockTableData = [
        ['Opening Stock', openingStock.toFixed(2)],
        ['Stock In', (totalTransferIn + totalPurchase).toFixed(2)],
        ['Closing Stock', closingStock.toFixed(2)],
        ['Actual Consumption', actualConsumption.toFixed(2)],
        ['Consumption as per DCR', consumptionAsPerDCR.toFixed(2)],
        ['Variance', `${variance.toFixed(2)} (${variancePercentage.toFixed(2)}%)`]
    ];

    doc.autoTable({
        startY: 10,
        body: stockTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [224, 224, 224] },
        margin: { top: 5, right: 14, left: 200 }, // Apply margin directly
        columnStyles: {
            0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' }, // Adjust column widths
            1: { cellWidth: 30, halign: 'right' },
        },
    });
}

function addMainTable(doc, locationKey, records) {
    const locationConfig = config.locations[locationKey];
    const tableStartY = doc.lastAutoTable.finalY + 10;
    const columnSettings = prepareColumnSettings(locationConfig.tableConfigOverride);

    const headers = columnSettings.map(col => col.label);
    const tableData = prepareMainTableData(records, locationKey, columnSettings);

    doc.autoTable({
        startY: tableStartY,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [224, 224, 224],
            textColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle',
            fontSize: 10
        },
        bodyStyles: { fontSize: 10 },
        columnStyles: columnSettings.reduce((acc, col, index) => ({
            ...acc,
            [index]: { halign: col.style?.align || 'center' }
        }), {}),
        didParseCell: function (data) {
            styleCellBasedOnContent(data, columnSettings);
        }
    });
}

function prepareColumnSettings(tableConfigOverride) {
    const defaultColumns = config.tableConfig.columns;
    const overrideColumns = tableConfigOverride?.columns;
    if (!overrideColumns) {
        return defaultColumns;
    }

    const overrideMap = new Map(overrideColumns.map(col => [col.pos, col]));
    return defaultColumns.map(col => overrideMap.get(col.pos) || col);
}

function prepareMainTableData(records, locationKey, columnSettings) {
    const tableData = records.map(record => columnSettings.map(col => col.value(record, locationKey)));

    // Calculate Totals
    const totalsRow = Array(columnSettings.length).fill('');
    totalsRow[0] = 'TOTAL'; // Label for totals row
    columnSettings.forEach((col, index) => {
        if (col.calculateTotal) {
            let sum = tableData.reduce((sum, row) => sum + parseFormattedNumber(row[index] || 0), 0).toFixed(2);
            totalsRow[index] = formatNumber(sum);
        }
    });
    tableData.push(totalsRow);

    return tableData;
}

const dayToColorMap = {
    'SUN': [204, 102, 0], // Orange
    'MON': [0, 102, 204], // Blue
    'TUE': [102, 204, 102], // Light Green
    'WED': [128, 128, 128], // Gray
    'THU': [153, 204, 0],  // Lime Green
    'FRI': [255, 0, 0],    // Red
    'SAT': [0, 128, 0]     // Green
};

function getTextColorForDay(day) {
    return dayToColorMap[day] || [0, 0, 0]; // Default color if day is not found
}

function styleCellBasedOnContent(data, columnSettings) {
    if (data.row.index === data.table.body.length - 1) { // Check if it's the total row
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [0, 0, 0];
        data.cell.styles.fillColor = [224, 224, 224];
    } else {
        const dayColumnIndex = columnSettings.findIndex(col => col.label === 'Day');
        const dayValue = data.row.raw[dayColumnIndex];

        // Apply the determined color to specific columns
        if (['Day', 'Cost/Manday', 'Cost%'].includes(columnSettings[data.column.index].label)) {
            data.cell.styles.textColor = getTextColorForDay(dayValue);
        }
    }
}

function finalizePDF(doc, locationName) {
    doc.save(`${locationName}_Daily_Consumption_Report.pdf`);
}
