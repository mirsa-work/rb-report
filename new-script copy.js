const config = {
    companyName: localStorage.getItem("companyName") ? localStorage.getItem("companyName") : '',
    locations: {
        "AMR": {
            "name": "Al Mariah",
            "rates": {
                seniorMandayRate: 20.00,
                juniorMandayRate: 17.00,
                labourMandayRate: 14.00,
                seniorParcelRate: 2.00,
                juniorParcelRate: 2.00,
                labourParcelRate: 2.00
            },
            "records": []
        },
        "ALNAZR": {
            "name": "Al Nazr",
            "rates": {
                seniorMandayRate: 20.00,
                juniorMandayRate: 17.00,
                labourMandayRate: 14.00,
                seniorParcelRate: 2.00,
                juniorParcelRate: 2.00,
                labourParcelRate: 2.00
            },
            "records": [],
            "tableConfigOverride": {
                columns: [{
                    pos: 6,
                    label: 'Parcel Count Breakfast',
                    value: (record) => record.parcelCount.breakfast,
                    calculateTotal: true
                }, {
                    pos: 7,
                    label: 'Parcel Count Lunch',
                    value: (record) => record.parcelCount.lunch,
                    calculateTotal: true
                }, {
                    pos: 8,
                    label: 'Parcel Count Dinner',
                    value: (record) => record.parcelCount.dinner,
                    calculateTotal: true
                }, {
                    pos: 9,
                    label: 'Total Parcel Count',
                    value: (record) => record.parcelCount.breakfast + record.parcelCount.lunch + record.parcelCount.dinner,
                    calculateTotal: true
                }]
            }
        }
    },
    tableConfig: {
        columns: [{
            pos: 0,
            label: 'Date',
            value: (record) => record.date.toISOString().split('T')[0]
        }, {
            pos: 1,
            label: 'Day',
            value: (record) => getDayOfWeek(record.date)
        }, {
            pos: 2,
            label: 'Seniors',
            value: (record) => record.manDays.senior,
            calculateTotal: true
        }, {
            pos: 3,
            label: 'Juniors',
            value: (record) => record.manDays.junior,
            calculateTotal: true
        }, {
            pos: 4,
            label: 'Labours',
            value: (record) => record.manDays.labour,
            calculateTotal: true
        }, {
            pos: 5,
            label: 'Total Mandays',
            value: (record) => record.manDays.senior + record.manDays.junior + record.manDays.labour,
            calculateTotal: true
        }, {
            pos: 6,
            label: 'Parcel Count Seniors',
            value: (record) => record.parcelCount.senior,
            calculateTotal: true
        }, {
            pos: 7,
            label: 'Parcel Count Juniors',
            value: (record) => record.parcelCount.junior,
            calculateTotal: true
        }, {
            pos: 8,
            label: 'Parcel Count Labours',
            value: (record) => record.parcelCount.labour,
            calculateTotal: true
        }, {
            pos: 9,
            label: 'Total Parcel Count',
            value: (record) => record.parcelCount.senior + record.parcelCount.junior + record.parcelCount.labour,
            calculateTotal: true
        }, {
            pos: 10,
            label: 'Consumption',
            value: (record) => record.consumption.toFixed(2),
            calculateTotal: true,
            style: {
                align: 'right'
            }
        }, {
            pos: 11,
            label: 'Total Revenue',
            value: (record, locationKey) => {
                const rates = config.locations[locationKey].rates;
                const revenue = (
                    (record.manDays.senior * rates.seniorMandayRate) +
                    (record.manDays.junior * rates.juniorMandayRate) +
                    (record.manDays.labour * rates.labourMandayRate) +
                    (record.parcelCount.senior * rates.seniorParcelRate) +
                    (record.parcelCount.junior * rates.juniorParcelRate) +
                    (record.parcelCount.labour * rates.labourParcelRate) -
                    (2 * (record.manDays.senior + record.manDays.junior + record.manDays.labour))
                ).toFixed(2);
                return parseFloat(revenue).toFixed(2);
            },
            calculateTotal: true,
            style: {
                align: 'right'
            }
        }, {
            pos: 12,
            label: 'Cost/Manday',
            value: (record) => {
                const totalMandays = record.manDays.senior + record.manDays.junior + record.manDays.labour;
                return totalMandays > 0 ? (record.consumption / totalMandays).toFixed(2) : '0.00';
            }
        }, {
            pos: 13,
            label: 'Cost%',
            value: (record, locationKey) => {
                const rates = config.locations[locationKey].rates;
                const revenue = (
                    (record.manDays.senior * rates.seniorMandayRate) +
                    (record.manDays.junior * rates.juniorMandayRate) +
                    (record.manDays.labour * rates.labourMandayRate) +
                    (record.parcelCount.senior * rates.seniorParcelRate) +
                    (record.parcelCount.junior * rates.juniorParcelRate) +
                    (record.parcelCount.labour * rates.labourParcelRate) -
                    (2 * (record.manDays.senior + record.manDays.junior + record.manDays.labour))
                ).toFixed(2);

                return revenue > 0 ? ((record.consumption * 100) / revenue).toFixed(2) : '0.00';
            }
        }]
    }
};

// Helper function to convert Excel serial date to JavaScript date
const excelSerialToDate = (serial) => {
    const excelEpoch = new Date(1899, 11, 30); // Excel starts counting dates from 1899-12-30
    const jsDate = new Date(excelEpoch.getTime() + serial * 86400000); // Add days in milliseconds
    return jsDate;
};

// Helper function to calculate the day of the week
const getDayOfWeek = (dateString) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const date = new Date(dateString);
    return days[date.getUTCDay()];
};

// Process the uploaded file
const processFile = () => {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload a CSV file.');
        return;
    }

    const companyName = document.getElementById('companyName').value;
    if (!companyName) {
        alert('Enter company name.');
        return;
    } else {
        localStorage.setItem("companyName", companyName);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const csvData = e.target.result;

        try {
            // Parse CSV using SheetJS
            const workbook = XLSX.read(csvData, { type: 'binary' });
            const sheetName = workbook.SheetNames[0]; // Get the first sheet name
            const sheet = workbook.Sheets[sheetName];

            // Convert sheet to JSON
            const parsedData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            // Format and sort the data by CF.Date
            parsedData.forEach((row) => {
                const location = row['CF.DCR#'].split('/')[1];
                const locationConfig = {
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

                config.locations[location].records.push(locationConfig);
            });

            Object.keys(config.locations).forEach((location) => {
                config.locations[location].records.sort((a, b) => a.date - b.date);
            });

            const locationKey = Object.keys(config.locations).filter((location) => config.locations[location].records.length > 0)[0];

            generatePDF(locationKey);
        } catch (error) {
            console.error('Error processing CSV:', error);
            alert(`There was an error processing the CSV file: ${error.message}`);
        }
    };

    reader.readAsBinaryString(file);
};

const generatePDF = (locationKey) => {
    console.log('config: ', config);

    const companyName = config.companyName;

    const locationConf = config.locations[locationKey];
    const location = locationConf.name;
    const records = locationConf.records;
    const numRecords = records.length;
    const firstRecord = records[0];
    const lastRecord = records[numRecords - 1];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); // Use landscape orientation for wide tables

    const openingStock = parseFloat(firstRecord.openingStock || 0);

    const totalTransferIn = records.reduce((sum, record) => sum + parseFloat(record.transferIn), 0);
    const totalPurchase = records.reduce((sum, record) => sum + parseFloat(record.purchase), 0);
    const totalStockIn = parseFloat((totalTransferIn + totalPurchase) || 0);

    const closingStock = parseFloat(lastRecord.closingStock || 0);

    // Calculate Stock Values
    const actualConsumption = openingStock + totalStockIn - closingStock;
    const consumptionAsPerDCR = records.reduce((sum, record) => sum + parseFloat(record.consumption || 0), 0);
    const variancePercentage = ((actualConsumption - consumptionAsPerDCR) / consumptionAsPerDCR) * 100;
    const variance = actualConsumption - consumptionAsPerDCR;

    // Add Header
    doc.setFontSize(18);
    doc.text(companyName, 14, 15);
    doc.setFontSize(14);
    doc.text(`Daily Consumption Report - ${location}`, 14, 25);

    // Add Stock Table
    const stockTable = [
        ['Opening Stock', openingStock.toFixed(2)],
        ['Stock In', totalStockIn.toFixed(2)],
        ['Closing Stock', closingStock.toFixed(2)],
        ['Actual Consumption', actualConsumption.toFixed(2)],
        ['Consumption as per DCR', consumptionAsPerDCR.toFixed(2)],
        ['Variance', `${variance.toFixed(2)} (${variancePercentage.toFixed(2)}%)`],
    ];

    // Manually Adjust the Position of Stock Table
    const stockTableMargin = { top: 5, right: 14, left: 200 }; // Left margin ensures right alignment
    doc.autoTable({
        startY: 10,
        body: stockTable,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [224, 224, 224] },
        margin: stockTableMargin, // Apply margin directly
        columnStyles: {
            0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' }, // Adjust column widths
            1: { cellWidth: 30, halign: 'right' },
        },
    });

    let columnConfig = config.tableConfig.columns.map(col => ({
        ...col, // Shallow copy of properties
        value: col.value // Explicitly copy the function reference
    }));
    const overrideColumns = locationConf.tableConfigOverride?.columns;
    if (overrideColumns != undefined && overrideColumns != null) {
        const overrideMap = new Map(overrideColumns.map(col => [col.pos, col]));

        columnConfig = columnConfig.map(col => overrideMap.get(col.pos) || col);
    }
    columnConfig.sort((a, b) => a.pos - b.pos);

    // Adjust main table position to account for the header and stock table
    const mainTableStartY = Math.max(doc.lastAutoTable.finalY + 10, 50); // Ensure enough spacing

    // Generate alignment settings dynamically
    const columnStyles = columnConfig.reduce((styles, col, index) => {
        styles[index] = { halign: col.style?.align || 'center' }; // Add alignment for each column
        return styles;
    }, {});

    const headers = columnConfig.map(col => col.label);
    const tableData = records.map((record) =>
        columnConfig.map(col => col.value(record, locationKey))
    );

    // Calculate Totals
    const totalsRow = Array(columnConfig.length).fill('');
    totalsRow[0] = 'TOTAL'; // Label for totals row

    columnConfig.forEach((col, index) => {
        if (col.calculateTotal) {
            totalsRow[index] = tableData.reduce((sum, row) => sum + parseFloat(row[index] || 0), 0).toFixed(2);
        }
    });

    // Add the totals row to the table data
    tableData.push(totalsRow);

    // Add Table
    doc.autoTable({
        startY: mainTableStartY,
        head: [headers],
        body: tableData,
        theme: 'grid', // Use grid theme for structured layout
        headStyles: {
            fillColor: [224, 224, 224],
            textColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle',
            fontSize: 10
        },
        bodyStyles: { fontSize: 10 },
        columnStyles: columnStyles, // Apply column alignment
        didParseCell: function (data) {
            // Style the totals row
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [0, 0, 0];
                data.cell.styles.fillColor = [224, 224, 224]; // Gray background for totals row
            } else {
                const columnIndex = data.column.index;
                const cellValue = data.cell.raw;

                // Get the column name
                const columnName = columnConfig[columnIndex].label;

                // Find the value of the 'Day' column in the current row
                const dayColumnIndex = columnConfig.findIndex(col => col.label === 'Day');
                const dayValue = data.row.raw[dayColumnIndex]; // Get the 'Day' value for this row

                // Determine the color based on the day of the week
                let textColor;
                if (dayValue === 'FRI') {
                    textColor = [255, 0, 0]; // Red for Friday
                } else if (dayValue === 'SAT') {
                    textColor = [0, 128, 0]; // Green for Saturday
                } else if (dayValue === 'SUN') {
                    textColor = [204, 102, 0]; // Orange for Sunday
                } else if (dayValue === 'MON') {
                    textColor = [0, 102, 204]; // Blue for Monday
                } else if (dayValue === 'TUE') {
                    textColor = [102, 204, 102]; // Light Green for Tuesday
                } else if (dayValue === 'WED') {
                    textColor = [128, 128, 128]; // Gray for Wednesday
                } else if (dayValue === 'THU') {
                    textColor = [153, 204, 0]; // Lime Green for Thursday
                }

                // Apply the determined color to specific columns
                if (columnName === 'Day' || columnName === 'Cost/Manday' || columnName === 'Cost%') {
                    data.cell.styles.textColor = textColor;
                }
            }
        }
    });

    // Save the Styled PDF
    doc.save(`${location}_report.pdf`);
};

if (config.companyName) {
    document.getElementById('companyName').value = config.companyName;
}
