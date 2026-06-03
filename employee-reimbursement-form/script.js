document.addEventListener('DOMContentLoaded', () => {
    // Auto-set baseline authorization dates to current system calendar
    const dateInput = document.getElementById('employeeSignatureDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    const tableBody = document.getElementById('purchaseTableBody');
    const addRowBtn = document.getElementById('addPurchaseRowBtn');

    if (tableBody) {
        const initialRow = tableBody.querySelector('tr');
        if (initialRow) attachRowListeners(initialRow);
    }

    // Dynamic row generation management processes
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => {
            const newRow = document.createElement('tr');
            newRow.className = 'transition-colors';
            newRow.innerHTML = `
                <td class="p-1 border-r border-gray-200 text-center">
                    <input type="date" class="date-input border border-gray-300 rounded p-1 text-center w-full text-xs outline-none">
                </td>
                <td class="p-1 border-r border-gray-200">
                    <input type="text" class="desc-input border border-gray-300 rounded p-1 w-full text-xs outline-none" placeholder="Item description details">
                </td>
                <td class="p-1 border-r border-gray-200 text-center">
                    <input type="number" step="0.01" class="total-input border border-gray-300 rounded p-1 text-right w-full text-xs outline-none" placeholder="0.00">
                </td>
                <td class="p-1 border-r border-gray-200 text-center">
                    <input type="number" step="0.01" class="tax-input border border-gray-300 rounded p-1 text-right w-full text-xs outline-none" placeholder="0.00">
                </td>
                <td class="reimburse-amount-cell p-2 border-r border-gray-200 text-right font-bold text-gray-700">0.00</td>
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

    // --- High-Fidelity Canvas Signature Pad Engine ---
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

// Native Browser Printing Pipeline Handshake
function triggerNativePrintWorkflow() {
    const empName = document.getElementById('employeeName').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    const canvas = document.getElementById('employeeCanvas');
    const printImg = document.getElementById('signaturePrintImg');
    const isCanvasDirty = canvas && canvas.dataset.dirty === "true";

    if (!empName) {
        alert("Please enter the Employee Name before downloading.");
        document.getElementById('employeeName').focus();
        return;
    }
    if (!purpose) {
        alert("Please provide the Purpose of Purchase.");
        document.getElementById('purpose').focus();
        return;
    }
    if (!isCanvasDirty) {
        alert("Please sign your authorization on the digital pad before printing.");
        return;
    }

    // Convert canvas data into binary base64 asset vector blocks for layout preservation
    if (canvas && printImg) {
        const dataUrl = canvas.toDataURL('image/png');
        printImg.src = dataUrl;
        
        // Dynamic visibility handshake to render graphic correctly in print engine context
        canvas.classList.add('hidden');
        printImg.classList.remove('hidden');
        printImg.classList.add('block');
    }

    // Trigger browser print subsystem framework
    window.print();

    // Revert visual state elements back to initial web interactive configuration
    if (canvas && printImg) {
        canvas.classList.remove('hidden');
        printImg.classList.add('hidden');
        printImg.classList.remove('block');
    }
}
