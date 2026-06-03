document.addEventListener('DOMContentLoaded', () => {
    // Set default signature date to today
    const dateInput = document.getElementById('employeeSignatureDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    const tableBody = document.getElementById('purchaseTableBody');
    const addRowBtn = document.getElementById('addPurchaseRowBtn');

    if (tableBody) {
        const initialRow = tableBody.querySelector('tr');
        if (initialRow) attachRowListeners(initialRow);
    }

    // Dynamic Row Generation
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => {
            const newRow = document.createElement('tr');
            newRow.className = 'input-row-focus transition-colors';
            newRow.innerHTML = `
                <td class="p-1 border-r border-gray-200 text-center">
                    <input type="date" class="date-input border border-gray-300 rounded p-1 text-center w-full text-xs focus:ring-1 focus:ring-[#002855]">
                </td>
                <td class="p-1 border-r border-gray-200">
                    <input type="text" class="desc-input border border-gray-300 rounded p-1 w-full text-xs focus:ring-1 focus:ring-[#002855]" placeholder="Enter item profile details">
                </td>
                <td class="p-1 border-r border-gray-200 text-center">
                    <input type="number" step="0.01" class="total-input border border-gray-300 rounded p-1 text-right w-full text-xs focus:ring-1 focus:ring-[#002855]" placeholder="0.00">
                </td>
                <td class="p-1 border-r border-gray-200 text-center">
                    <input type="number" step="0.01" class="tax-input border border-gray-300 rounded p-1 text-right w-full text-xs focus:ring-1 focus:ring-[#002855]" placeholder="0.00">
                </td>
                <td class="reimburse-amount-cell p-2 border-r border-gray-200 text-right font-semibold text-gray-600">0.00</td>
                <td class="p-1 text-center no-print">
                    <button type="button" class="delete-row-btn text-gray-400 hover:text-red-500 text-sm font-bold transition-colors">&times;</button>
                </td>
            `;
            tableBody.appendChild(newRow);
            attachRowListeners(newRow);
        });
    }

    function attachRowListeners(row) {
        const totalInput = row.querySelector('.total-input');
        const taxInput = row.querySelector('.tax-input');
        const deleteBtn = row.querySelector('.delete-row-btn');

        if (totalInput) totalInput.addEventListener('input', () => calculateRow(row));
        if (taxInput) taxInput.addEventListener('input', () => calculateRow(row));
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (tableBody.querySelectorAll('tr').length > 1) {
                    row.remove();
                    recalculateGrandTotal();
                } else {
                    alert("Your reimbursement ledger must contain at least one line entry.");
                }
            });
        }
    }

    function calculateRow(row) {
        const totalVal = parseFloat(row.querySelector('.total-input').value) || 0;
        const taxVal = parseFloat(row.querySelector('.tax-input').value) || 0;
        const netCell = row.querySelector('.reimburse-amount-cell');

        let netAmount = totalVal - taxVal;
        if (netAmount < 0) netAmount = 0;

        netCell.innerText = netAmount.toFixed(2);
        recalculateGrandTotal();
    }

    function recalculateGrandTotal() {
        let grandTotal = 0;
        document.querySelectorAll('.reimburse-amount-cell').forEach(cell => {
            grandTotal += parseFloat(cell.innerText) || 0;
        });
        const totalDisplay = document.getElementById('totalReimbursementAmount');
        if (totalDisplay) totalDisplay.innerText = `$${grandTotal.toFixed(2)}`;
    }

    // --- Signature Canvas Handling Engine ---
    const canvas = document.getElementById('employeeCanvas');
    const clearBtn = document.getElementById('clearCanvasBtn');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#002855'; 
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }

        function startDraw(e) {
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            if (e.cancelable) e.preventDefault();
        }

        function draw(e) {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            if (e.cancelable) e.preventDefault();
        }

        function stopDraw() { isDrawing = false; }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDraw);

        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDraw);

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.dataset.dirty = "false";
            });
        }
        canvas.addEventListener('mousedown', () => canvas.dataset.dirty = "true");
        canvas.addEventListener('touchstart', () => canvas.dataset.dirty = "true");
    }
});

// Structural Background PDF Sync & Compile Workflow
function executeDownloadWorkflow() {
    const empName = document.getElementById('employeeName').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    const dateVal = document.getElementById('employeeSignatureDate').value;
    
    const canvas = document.getElementById('employeeCanvas');
    const isCanvasDirty = canvas && canvas.dataset.dirty === "true";
    const submitBtn = document.getElementById('btnSubmitReimbursement');

    if (!empName) {
        alert("Please enter the Employee Name before submitting.");
        document.getElementById('employeeName').focus();
        return;
    }
    if (!purpose) {
        alert("Please provide the Purpose of Purchase.");
        document.getElementById('purpose').focus();
        return;
    }
    if (!isCanvasDirty) {
        alert("Please provide your authorization signature on the digital canvas block.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Compiling PDF Voucher...";

    // --- SYNC WORKFLOW: Populate the Hidden Print Template HTML ---
    document.getElementById('print-lbl-name').innerText = empName;
    document.getElementById('print-lbl-purpose').innerText = purpose;
    
    // Format Signature Date cleanly
    if (dateVal) {
        const d = new Date(dateVal + 'T00:00:00');
        document.getElementById('print-lbl-date').innerText = d.toLocaleDateString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric'
        });
    } else {
        document.getElementById('print-lbl-date').innerText = '';
    }

    // Dynamic conversion of individual item lines
    const printTableBody = document.getElementById('print-table-body');
    printTableBody.innerHTML = ''; // Reset frame tracking
    
    const webRows = document.querySelectorAll('#purchaseTableBody tr');
    webRows.forEach(row => {
        const rDate = row.querySelector('.date-input').value;
        const rDesc = row.querySelector('.desc-input').value.trim();
        const rTotal = parseFloat(row.querySelector('.total-input').value) || 0;
        const rTax = parseFloat(row.querySelector('.tax-input').value) || 0;
        const rNet = parseFloat(row.querySelector('.reimburse-amount-cell').innerText) || 0;

        let formattedDate = '';
        if (rDate) {
            const d = new Date(rDate + 'T00:00:00');
            formattedDate = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        }

        const printRow = document.createElement('tr');
        printRow.style.borderBottom = '1px solid #e2e8f0';
        printRow.innerHTML = `
            <td style="padding: 7px 8px; text-align: center; border-right: 1px solid #e2e8f0;">${formattedDate}</td>
            <td style="padding: 7px 8px; border-right: 1px solid #e2e8f0; white-space: normal; word-break: break-word;">${rDesc || '—'}</td>
            <td style="padding: 7px 8px; text-align: right; border-right: 1px solid #e2e8f0;">$${rTotal.toFixed(2)}</td>
            <td style="padding: 7px 8px; text-align: right; border-right: 1px solid #e2e8f0;">$${rTax.toFixed(2)}</td>
            <td style="padding: 7px 8px; text-align: right; font-weight: 600;">$${rNet.toFixed(2)}</td>
        `;
        printTableBody.appendChild(printRow);
    });

    // Populate Grand Financial Summaries
    const grandTotalText = document.getElementById('totalReimbursementAmount').innerText;
    document.getElementById('print-lbl-grandtotal').innerText = grandTotalText;

    // Convert Canvas Drawing Strokes to an Image URL for the PDF Engine
    const sigImage = document.getElementById('print-sig-image');
    sigImage.src = canvas.toDataURL('image/png');
    sigImage.style.display = 'inline-block';

    // Target the hidden printable element container frame explicitly
    const printElement = document.getElementById('hidden-print-template');
    printElement.style.display = 'block'; // Momentarily unlock target mapping display

    const options = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `EPSD73_Reimbursement_${empName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Execute background document download handoff
    html2pdf().set(options).from(printElement).save().then(() => {
        printElement.style.display = 'none'; // Relock print element layout hiding
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign & Submit Reimbursement";
    }).catch(err => {
        console.error("PDF Engine Error: ", err);
        printElement.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign & Submit Reimbursement";
    });
}
