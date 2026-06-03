document.addEventListener('DOMContentLoaded', () => {
    // Standard initialization rules: auto-fill signatures with current calendar dates
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
                <td class="reimburse-amount-cell p-2 border-r border-gray-200 text-right font-bold text-gray-700">0.00</td>
                <td class="p-1 text-center no-print-pdf">
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

    // --- Interactive Canvas Signature Pad Engine ---
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

// Structural Compilation PDF Workflow Engine
function executeDownloadWorkflow() {
    const empName = document.getElementById('employeeName').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    
    const canvas = document.getElementById('employeeCanvas');
    const isCanvasDirty = canvas && canvas.dataset.dirty === "true";
    const submitBtn = document.getElementById('btnSubmitReimbursement');
    const targetFormElement = document.getElementById('reimbursement-form-container');

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

    // Toggle execution states
    submitBtn.disabled = true;
    submitBtn.innerText = "Compiling PDF Voucher...";

    // Apply strict rendering frame overrides directly to active DOM layout 
    targetFormElement.classList.add('printing-pdf-active');

    const options = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `EPSD73_Reimbursement_${empName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Compile, save, and restore interface styling state contexts
    html2pdf().set(options).from(targetFormElement).save().then(() => {
        targetFormElement.classList.remove('printing-pdf-active');
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign & Submit Reimbursement";
    }).catch(err => {
        console.error("PDF Compilation Failure: ", err);
        targetFormElement.classList.remove('printing-pdf-active');
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign & Submit Reimbursement";
    });
}
