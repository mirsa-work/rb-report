const locationMappings = {
    al_nazr: {
        headers: [
            { name: 'Date', calculate: (row) => row['CF.Date'] },
            { name: 'Day', calculate: (row) => getDayOfWeek(row['CF.Date']) },
            { name: 'Seniors', calculate: (row) => row['CF.Mandays - Senior'], calculateTotal: true },
            { name: 'Juniors', calculate: (row) => row['CF.Mandays - Junior'], calculateTotal: true },
            { name: 'Labours', calculate: (row) => row['CF.Mandays - Labour'], calculateTotal: true },
            { name: 'Total Mandays', calculate: (row) => row['CF.Total Mandays'], calculateTotal: true },
            { name: 'Parcel Count Breakfast', calculate: (row) => row['CF.Parcel Count - Breakfast'], calculateTotal: true },
            { name: 'Parcel Count Lunch', calculate: (row) => row['CF.Parcel Count - Lunch'], calculateTotal: true },
            { name: 'Parcel Count Dinner', calculate: (row) => row['CF.Parcel Count - Dinner'], calculateTotal: true },
            {
                name: 'Total Parcel Count',
                calculate: (row) => (
                    parseInt(row['CF.Parcel Count - Breakfast'] || 0, 10) +
                    parseInt(row['CF.Parcel Count - Lunch'] || 0, 10) +
                    parseInt(row['CF.Parcel Count - Dinner'] || 0, 10)
                ),
                calculateTotal: true
            },
            {
                name: 'Consumption',
                calculate: (row) => parseFloat(row['CF.Consumption'] || 0).toFixed(2),
                align: 'right',
                calculateTotal: true
            },
            {
                name: 'Total Revenue',
                calculate: (row) => parseFloat(row['CF.Total Revenue'] || 0).toFixed(2),
                align: 'right',
                calculateTotal: true
            },
            {
                name: 'Cost/Manday',
                calculate: (row) => {
                    const consumption = parseFloat(row['CF.Consumption'] || 0);
                    const totalMandays = (
                        parseInt(row['CF.Mandays - Senior'] || 0, 10) +
                        parseInt(row['CF.Mandays - Junior'] || 0, 10) +
                        parseInt(row['CF.Mandays - Labour'] || 0, 10)
                    );
                    return totalMandays > 0 ? (consumption / totalMandays).toFixed(2) : '0.00';
                }
            },
            {
                name: 'Cost %',
                calculate: (row) => {
                    const consumption = parseFloat(row['CF.Consumption'] || 0);
                    const revenue = parseFloat(row['CF.Total Revenue'] || 0);

                    return revenue > 0 ? ((consumption * 100) / revenue).toFixed(2) : '0.00';
                },
                align: 'right'
            }
        ],
        groupHeaders: [
            { title: 'Mandays', from: 2, to: 5 }, // Columns 2-5 under "Mandays"
            { title: 'Parcel Count', from: 6, to: 9 } // Columns 6-9 under "Parcel Count"
        ]
    },
    al_mariah: {
        headers: [
            { name: 'Date', calculate: (row) => row['CF.Date'] },
            { name: 'Day', calculate: (row) => getDayOfWeek(row['CF.Date']) },
            { name: 'Seniors', calculate: (row) => row['CF.Mandays - Senior'], calculateTotal: true },
            { name: 'Juniors', calculate: (row) => row['CF.Mandays - Junior'], calculateTotal: true },
            { name: 'Labours', calculate: (row) => row['CF.Mandays - Labour'], calculateTotal: true },
            {
                name: 'Total Mandays',
                calculate: (row) => (
                    parseInt(row['CF.Mandays - Senior'] || 0, 10) +
                    parseInt(row['CF.Mandays - Junior'] || 0, 10) +
                    parseInt(row['CF.Mandays - Labour'] || 0, 10)
                ),
                calculateTotal: true
            },
            { name: 'Parcel Count Senior', calculate: (row) => row['CF.Parcel Count - Senior'], calculateTotal: true },
            { name: 'Parcel Count Junior', calculate: (row) => row['CF.Parcel Count - Junior'], calculateTotal: true },
            { name: 'Parcel Count Labour', calculate: (row) => row['CF.Parcel Count - Labour'], calculateTotal: true },
            {
                name: 'Total Parcel Count',
                calculate: (row) => (
                    parseInt(row['CF.Parcel Count - Senior'] || 0, 10) +
                    parseInt(row['CF.Parcel Count - Junior'] || 0, 10) +
                    parseInt(row['CF.Parcel Count - Labour'] || 0, 10)
                ),
                calculateTotal: true
            },
            {
                name: 'Consumption',
                calculate: (row) => parseFloat(row['CF.Consumption'] || 0).toFixed(2),
                align: 'right',
                calculateTotal: true
            },
            {
                name: 'Total Revenue',
                calculate: (row) => parseFloat(row['CF.Total Revenue'] || 0).toFixed(2),
                align: 'right',
                calculateTotal: true
            },
            {
                name: 'Cost/Manday',
                calculate: (row) => {
                    const consumption = parseFloat(row['CF.Consumption'] || 0);
                    const totalMandays = (
                        parseInt(row['CF.Mandays - Senior'] || 0, 10) +
                        parseInt(row['CF.Mandays - Junior'] || 0, 10) +
                        parseInt(row['CF.Mandays - Labour'] || 0, 10)
                    );
                    return totalMandays > 0 ? (consumption / totalMandays).toFixed(2) : '0.00';
                }
            },
            {
                name: 'Cost %',
                calculate: (row) => parseFloat(row['CF.Cost %'] || 0).toFixed(2),
                align: 'right'
            }
        ],
        groupHeaders: [
            { title: 'Mandays', from: 2, to: 5 }, // Columns 2-5 under "Mandays"
            { title: 'Parcel Count', from: 6, to: 9 } // Columns 6-9 under "Parcel Count"
        ]
    }
};

// Enable file upload and button only after selecting location
document.getElementById('businessLocation').addEventListener('change', (event) => {
    const location = event.target.value;
    const fileInput = document.getElementById('csvFile');
    const button = document.querySelector('button');
    if (location) {
        fileInput.disabled = false;
        button.disabled = false;
    } else {
        fileInput.disabled = true;
        button.disabled = true;
    }
});

// Helper function to convert Excel serial date to JavaScript date
const excelSerialToDate = (serial) => {
    const excelEpoch = new Date(1899, 11, 30); // Excel starts counting dates from 1899-12-30
    const jsDate = new Date(excelEpoch.getTime() + serial * 86400000); // Add days in milliseconds
    return jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Helper function to calculate the day of the week
const getDayOfWeek = (dateString) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const date = new Date(dateString);
    return days[date.getUTCDay()];
};

// Process the uploaded file
const processFile = () => {
    const location = document.getElementById('businessLocation').value;
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload a CSV file.');
        return;
    }

    const mapping = locationMappings[location];
    if (!mapping) {
        alert('Invalid location selected.');
        return;
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

            // Convert and sort the data by CF.Date
            const sortedData = parsedData
                .map((row) => {
                    // Convert CF.Date if it is a serial number
                    if (!isNaN(row['CF.Date'])) {
                        row['CF.Date'] = excelSerialToDate(row['CF.Date']);
                    }

                    return row;
                })
                .sort((a, b) => new Date(a['CF.Date']) - new Date(b['CF.Date'])); // Sort by date

            // Generate headers and table rows for the PDF
            const pdfHeaders = mapping.headers.map(header => header.text ? header.text : header.name);
            const tableData = sortedData.map((row) =>
                mapping.headers.map(header => header.calculate(row))
            );

            generatePDF(pdfHeaders, tableData, mapping.headers, location);
        } catch (error) {
            console.error('Error processing CSV:', error);
            alert(`There was an error processing the CSV file: ${error.message}`);
        }
    };

    reader.readAsBinaryString(file);
};

// Generate the PDF report
const generatePDF = (headers, tableData, headerMapping, location) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); // Use landscape orientation for wide tables

    // Get user inputs
    const openingStock = parseFloat(document.getElementById('openingStock').value || 0);
    const stockIn = parseFloat(document.getElementById('stockIn').value || 0);
    const closingStock = parseFloat(document.getElementById('closingStock').value || 0);

    // Calculate Stock Values
    const actualConsumption = openingStock + stockIn - closingStock;
    const consumptionAsPerDCR = tableData.reduce((sum, row) => sum + parseFloat(row[10] || 0), 0); // Column 10: 'Consumption'
    const variancePercentage = ((actualConsumption - consumptionAsPerDCR) / consumptionAsPerDCR) * 100;
    const variance = actualConsumption - consumptionAsPerDCR;

    // Add Header
    doc.setFontSize(18);
    doc.text('RB Catering Services Co LLC', 14, 15);
    doc.setFontSize(14);
    doc.text(`Daily Consumption Report - ${location.toUpperCase()}`, 14, 25);

    // Add Stock Table
    const stockTable = [
        ['Opening Stock', openingStock.toFixed(2)],
        ['Stock In', stockIn.toFixed(2)],
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

    // Adjust main table position to account for the header and stock table
    const mainTableStartY = Math.max(doc.lastAutoTable.finalY + 10, 50); // Ensure enough spacing

    // Generate alignment settings dynamically
    const columnStyles = headerMapping.reduce((styles, header, index) => {
        styles[index] = { halign: header.align || 'center' }; // Add alignment for each column
        return styles;
    }, {});

    // Calculate Totals
    const totalsRow = Array(headers.length).fill('');
    totalsRow[0] = 'TOTAL'; // Label for totals row

    headerMapping.forEach((header, index) => {
        if (header.calculateTotal) {
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

                // Get the column name from the headerMapping
                const columnName = headerMapping[columnIndex].name;

                // Find the value of the 'Day' column in the current row
                const dayColumnIndex = headerMapping.findIndex(header => header.name === 'Day');
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
                if (columnName === 'Day' || columnName === 'Cost/Manday' || columnName === 'Cost %') {
                    data.cell.styles.textColor = textColor;
                }
            }
        }
    });

    // Save the Styled PDF
    doc.save(`${location}_report.pdf`);
};
