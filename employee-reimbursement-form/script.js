// Dynamic Calculations Framework
function updateRowReimbursement(row) {
    const totalInput = row.querySelector('.total-input');
    const taxInput = row.querySelector('.tax-input');
    const reimburseCell = row.querySelector('.reimburse-amount-cell');

    const totalAmount = parseFloat(totalInput.value) || 0;
    const salesTax = parseFloat(taxInput.value) || 0;
    const reimburseAmount = Math.max(0, totalAmount - salesTax);

    reimburseCell.innerText = reimburseAmount.toFixed(2);
    calculateGrandTotal();
}

function calculateGrandTotal() {
    const tableBody = document.getElementById('purchaseTableBody');
    const rows = tableBody.querySelectorAll('tr');
    let grandTotal = 0;
    rows.forEach(row => {
        const reimburseCell = row.querySelector('.reimburse-amount-cell');
        const amount = parseFloat(reimburseCell.innerText) || 0;
        grandTotal += amount;
    });
    document.getElementById('totalReimbursementAmount').innerText = grandTotal.toFixed(2);
}

function addPurchaseRow() {
    const tableBody = document.getElementById('purchaseTableBody');
    const newRow = document.createElement('tr');
    newRow.className = 'border-b last:border-0 hover:bg-gray-100 transition-colors';

    newRow.innerHTML = `
        <td class="p-2"><input type="date" class="bg-transparent w-full focus:outline-none text-sm date-input"></td>
        <td class="p-2"><input type="text" class="bg-transparent w-full focus:outline-none text-sm desc-input" placeholder="e.g., Science Lab Consumables"></td>
        <td class="p-2 text-right"><input type="number" step="0.01" class="bg-transparent w-full focus:outline-none text-sm text-right total-input" placeholder="0.00"></td>
        <td class="p-2 text-right"><input type="number" step="0.01" class="bg-transparent w-full focus:outline-none text-sm text-right tax-input" placeholder="0.00"></td>
        <td class="p-2 text-right text-gray-800 font-semibold reimburse-amount-cell">0.00</td>
        <td class="p-2 text-right no-print"><button class="delete-row-btn text-gray-500 hover:text-red-500 text-xl font-bold">&times;</button></td>
    `;

    bindRowEvents(newRow);
    tableBody.appendChild(newRow);
    calculateGrandTotal();
}

function bindRowEvents(row) {
    row.querySelector('.total-input').addEventListener('input', () => updateRowReimbursement(row));
    row.querySelector('.tax-input').addEventListener('input', () => updateRowReimbursement(row));
    row.querySelector('.delete-row-btn').addEventListener('click', function() {
        row.remove();
        calculateGrandTotal();
    });
}

// Live Signature System Canvas Engine
let drawing = false;
const canvas = document.getElementById('employeeCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let hasSigned = false; 

function resizeCanvas() {
    if (!canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.drawImage(tempCanvas, 0, 0);
}

function getCoordinates(e) {
    const currentRect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - currentRect.left,
        y: clientY - currentRect.top
    };
}

// Drawing Logic
function startDrawing(e) {
    drawing = true;
    hasSigned = true;
    const pos = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
}

function draw(e) {
    if (!drawing) return;
    const pos = getCoordinates(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#0f766e'; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    e.preventDefault();
}

function stopDrawing() { drawing = false; }

// Processing and Pipeline Generation
function sendToBusinessOffice() {
    const employeeInputName = document.getElementById('employeeName').value.trim();
    const employeeName = employeeInputName || '[Employee Name]';
    const fileSaveName = `Reimbursement_Form_${employeeInputName ? employeeInputName.replace(/\s+/g, '_') : 'Form'}.pdf`;

    document.getElementById('print-lbl-name').innerText = employeeInputName || ' ';
    document.getElementById('print-lbl-purpose').innerText = document.getElementById('purpose').value.trim() || ' ';
    
    const rawDate = document.getElementById('employeeSignatureDate').value;
    if (rawDate) {
        const parts = rawDate.split('-');
        document.getElementById('print-lbl-date').innerText = `${parts[1]}/${parts[2]}/${parts[0]}`;
    } else {
        document.getElementById('print-lbl-date').innerText = ' ';
    }

    const printTableBody = document.getElementById('print-table-body');
    printTableBody.innerHTML = '';
    
    const screenRows = document.querySelectorAll('#purchaseTableBody tr');
    screenRows.forEach(row => {
        const dateVal = row.querySelector('.date-input').value;
        let formattedDate = '';
        if(dateVal) {
            const dParts = dateVal.split('-');
            formattedDate = `${dParts[1]}/${dParts[2]}/${dParts[0]}`;
        }
        const descVal = row.querySelector('.desc-input').value || ' ';
        const totalVal = parseFloat(row.querySelector('.total-input').value).toFixed(2);
        const taxVal = parseFloat(row.querySelector('.tax-input').value).toFixed(2);
        const reimbVal = row.querySelector('.reimburse-amount-cell').innerText;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">${formattedDate}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; white-space: normal; word-break: break-word; overflow-wrap: break-word; vertical-align: top;">${descVal}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top;">${isNaN(totalVal) ? '0.00' : totalVal}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top;">${isNaN(taxVal) ? '0.00' : taxVal}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; vertical-align: top;">${reimbVal}</td>
        `;
        printTableBody.appendChild(tr);
    });

    document.getElementById('print-lbl-grandtotal').innerText = '$' + document.getElementById('totalReimbursementAmount').innerText;

    const sigImage = document.getElementById('print-sig-image');
    if (hasSigned) {
        sigImage.src = canvas.toDataURL('image/png');
        sigImage.style.display = 'block';
    } else {
        sigImage.style.display = 'none';
    }

    const printElement = document.getElementById('hidden-print-template');
    printElement.style.display = 'block'; 

    const opt = {
        margin:       0.3, 
        filename:     fileSaveName,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            scrollY: 0, 
            scrollX: 0
        },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css'] }
    };

    html2pdf().set(opt).from(printElement).save().then(() => {
        printElement.style.display = 'none'; 

        const recipient = "business@eps73.net";
        const subject = encodeURIComponent(`Employee Reimbursement Form Submission - ${employeeName}`);
        const body = encodeURIComponent("Hello,\n\nPlease find my attached Employee Reimbursement Form and matching receipts/invoices attached below.\n\nThank you!");
        
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');

        setTimeout(() => {
            alert(`Success!\n\n1. Your form has been downloaded as "${fileSaveName}".\n2. Gmail has opened in a new tab.\n3. Please drag and drop the downloaded PDF form AND your digital receipts into your Gmail window to submit.`);
        }, 500);
    }).catch(err => {
        console.error("PDF Processing Error: ", err);
        printElement.style.display = 'none';
    });
}

if (canvas) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);
    window.addEventListener('resize', resizeCanvas);
}

// Initialization and Event Attachment
document.getElementById('addPurchaseRowBtn').addEventListener('click', addPurchaseRow);
document.getElementById('printFormBtn').addEventListener('click', () => window.print());
document.getElementById('sendOfficeBtn').addEventListener('click', sendToBusinessOffice);
document.getElementById('clearCanvasBtn').addEventListener('click', function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSigned = false;
});

// Bind calculations to the default single row in index.html on load
const initialRow = document.querySelector('#purchaseTableBody tr');
if (initialRow) {
    bindRowEvents(initialRow);
}

calculateGrandTotal();
setTimeout(resizeCanvas, 400);