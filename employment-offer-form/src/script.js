// ====== PART 1: WORKFLOW STATE & CANVAS ENGINE ======

// URL Parameter Helper to unpack data for Solution 1
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Determine if a New Hire is opening a shared link or if Admin is creating one
const isNewHireMode = getUrlParam('mode') === 'newhire';

document.addEventListener("DOMContentLoaded", function() {
    setupWorkflowUI();
    if (canvas) {
        setupCanvasEngine();
    }
    // Seed default date input values to today's local value
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('signatureDate')) {
        document.getElementById('signatureDate').value = today;
    }
});

function setupWorkflowUI() {
    const banner = document.getElementById('workflow-banner');
    const sigSection = document.getElementById('signature-section');
    const adminBtn = document.getElementById('adminGenLinkBtn');
    const hireBtn = document.getElementById('sendOfficeBtn');

    if (isNewHireMode) {
        // Shift UI to New Hire Mode: Lock down offer details, unlock signature
        banner.className = "mb-6 p-4 rounded-xl text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-800";
        banner.innerHTML = "✍️ <strong>New Hire Review:</strong> Please review your offer details, fill in your demographics, sign below, and submit.";
        
        sigSection.classList.remove('style-disabled', 'opacity-40', 'pointer-events-none');
        adminBtn.style.display = 'none';
        hireBtn.style.display = 'block';

        // Pre-fill locked contract variables passed from the admin assistant
        document.getElementById('position').value = getUrlParam('pos') || '';
        document.getElementById('education').value = getUrlParam('edu') || 'BA';
        document.getElementById('longevity').value = getUrlParam('long') || '0';
        document.getElementById('startDate').value = getUrlParam('start') || '';
        document.getElementById('salary').value = getUrlParam('sal') || '0.00';
        document.getElementById('sickDays').value = getUrlParam('sick') || '0';
        document.getElementById('personalDays').value = getUrlParam('pers') || '0';
        document.getElementById('vacationDays').value = getUrlParam('vac') || '0';
        document.getElementById('schoolYearStart').value = getUrlParam('y-start') || '2026';
        document.getElementById('schoolYearEnd').value = getUrlParam('y-end') || '2027';

        // Disable input fields for Section 2 so details cannot be altered by new hire
        const fields = ['position', 'education', 'longevity', 'startDate', 'salary', 'sickDays', 'personalDays', 'vacationDays', 'schoolYearStart', 'schoolYearEnd'];
        fields.forEach(id => document.getElementById(id).disabled = true);
    } else {
        // Admin Assistant View
        adminBtn.addEventListener('click', generateSharedLink);
    }
}

// Live Signature Canvas Drawing Logic
let drawing = false;
const canvas = document.getElementById('employeeCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let hasSigned = false; 

function setupCanvasEngine() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);
    window.addEventListener('resize', resizeCanvas);
    
    document.getElementById('clearCanvasBtn').addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSigned = false;
    });
    
    setTimeout(resizeCanvas, 400);
}

function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.drawImage(tempCanvas, 0, 0);
}

function getCoordinates(e) {
    const currentRect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - currentRect.left, y: clientY - currentRect.top };
}

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
    ctx.strokeStyle = '#047857'; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    e.preventDefault();
}

function stopDrawing() { drawing = false; }

function formatDate(rawDate) {
    if (!rawDate) return '';
    const parts = rawDate.split('-');
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}
// ====== PART 2: ADMIN LINK GENERATION ENGINE ======

function generateSharedLink() {
    // Collect the administrative/contract fields entered by the assistant
    const pos = encodeURIComponent(document.getElementById('position').value.trim());
    const edu = encodeURIComponent(document.getElementById('education').value);
    const lg = encodeURIComponent(document.getElementById('longevity').value || '0');
    const start = encodeURIComponent(document.getElementById('startDate').value);
    const sal = encodeURIComponent(document.getElementById('salary').value.trim());
    const sick = encodeURIComponent(document.getElementById('sickDays').value || '0');
    const pers = encodeURIComponent(document.getElementById('personalDays').value || '0');
    const vac = encodeURIComponent(document.getElementById('vacationDays').value || '0');
    const yStart = encodeURIComponent(document.getElementById('schoolYearStart').value.trim() || '2026');
    const yEnd = encodeURIComponent(document.getElementById('schoolYearEnd').value.trim() || '2027');

    // Construct the payload URL pointing back to this exact page with parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const securePayloadUrl = `${baseUrl}?mode=newhire&pos=${pos}&edu=${edu}&long=${lg}&start=${start}&sal=${sal}&sick=${sick}&pers=${pers}&vac=${vac}&y-start=${yStart}&y-end=${yEnd}`;

    // Copy the generated onboarding workflow link directly to the assistant's clipboard
    navigator.clipboard.writeText(securePayloadUrl).then(() => {
        alert("🎉 Success!\n\nThe personalized onboarding link has been copied to your clipboard.\n\nYou can now paste (Ctrl+V or Cmd+V) and email this directly to the new hire!");
    }).catch(err => {
        console.error("Clipboard routing restriction encountered: ", err);
        // Fallback if browser security blocks automated clipboard access
        prompt("Copy this complete onboarding link to email to the new hire:", securePayloadUrl);
    });
}
// ====== PART 3: DATA RETRIEVAL & PRINT MAPPING ======

function executePdfPipeline() {
    const fName = document.getElementById('firstName').value.trim();
    const lName = document.getElementById('lastName').value.trim();
    const fullName = `${fName} ${lName}`.trim() || '[Employee Name]';
    const fileSaveName = `Employment_Offer_${fullName.replace(/\s+/g, '_')}.pdf`;

    // Map screen parameters into hidden target print layout variables
    document.getElementById('print-lbl-fullname').innerText = fullName;
    document.getElementById('print-lbl-iein').innerText = document.getElementById('iein').value.trim() || 'N/A';
    document.getElementById('print-lbl-address').innerText = document.getElementById('streetAddress').value.trim() || '';
    
    const cityStr = document.getElementById('city').value.trim();
    const stateStr = document.getElementById('state').value.trim();
    const zipStr = document.getElementById('zipCode').value.trim();
    document.getElementById('print-lbl-citystatezip').innerText = cityStr ? `${cityStr}, ${stateStr} ${zipStr}` : '';
    
    document.getElementById('print-lbl-birthdate').innerText = formatDate(document.getElementById('birthDate').value);
    document.getElementById('print-lbl-phone').innerText = document.getElementById('phone').value.trim() || '';
    document.getElementById('print-lbl-email').innerText = document.getElementById('email').value.trim() || '';
    
    document.getElementById('print-lbl-position').innerText = document.getElementById('position').value.trim() || '';
    document.getElementById('print-lbl-education').innerText = document.getElementById('education').value;
    document.getElementById('print-lbl-longevity').innerText = document.getElementById('longevity').value || '0';
    document.getElementById('print-lbl-startdate').innerText = formatDate(document.getElementById('startDate').value);
    document.getElementById('print-lbl-salary').innerText = document.getElementById('salary').value.trim() || '0.00';
    
    document.getElementById('print-lbl-sick').innerText = document.getElementById('sickDays').value || '0';
    document.getElementById('print-lbl-personal').innerText = document.getElementById('personalDays').value || '0';
    document.getElementById('print-lbl-vacation').innerText = document.getElementById('vacationDays').value || '0';
    
    const sYear = document.getElementById('schoolYearStart').value.trim() || '_______';
    const eYear = document.getElementById('schoolYearEnd').value.trim() || '_______';
    document.getElementById('print-lbl-term-range').innerText = `${sYear} - ${eYear}`;
    
    document.getElementById('print-lbl-sigdate').innerText = formatDate(document.getElementById('signatureDate').value);

    // Prepare signature image layer
    const sigImage = document.getElementById('print-sig-image');
    if (hasSigned) {
        sigImage.src = canvas.toDataURL('image/png');
        sigImage.style.display = 'block';
    } else {
        sigImage.style.display = 'none';
    }

    // Call the rendering and email window initiation engine (Coming up in Part 4)
    renderPdfAndOpenGmail(fileSaveName, fullName, sYear, eYear);
}
// ====== PART 4: PDF RENDER PIPELINE ======

function renderPdfAndOpenGmail(fileSaveName, fullName, sYear, eYear) {
    const printElement = document.getElementById('hidden-print-template');
    printElement.style.display = 'block'; // Temporarily unhide to let canvas capture it

    const opt = {
        margin:       0.4, 
        filename:     fileSaveName,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Run the html2pdf exporter engine
    html2pdf().set(opt).from(printElement).save().then(() => {
        printElement.style.display = 'none'; // Re-hide print container immediately
        
        // Pass the variables to the final Gmail distribution script
        launchGmailTab(fullName, sYear, eYear, fileSaveName);
    }).catch(err => {
        console.error("PDF Native Execution Error: ", err);
        printElement.style.display = 'none';
    });
}
// ====== PART 5: SUBMISSION AUTOMATION ENGINE ======

function launchGmailTab(fullName, sYear, eYear, fileSaveName) {
    // We point the destination directly to HR as requested
    const targetHR = "hr@eps73.net";
    
    // Built cleanly with plain text strings to prevent gateway timeouts
    const mailSubject = "Terms of Employment Offer Profile - " + fullName;
    const mailBody = "Hello " + fullName + ",\n\nPlease find your attached Terms of Employment Offer profile for the " + sYear + "-" + eYear + " school year.\n\nPlease review the terms, digitally sign the document using your PDF viewer (Adobe, Preview, DocuSign, etc.), and reply back to this email with the completed copy.\n\nWelcome to East Prairie School District 73!";
    
    // Assemble the clean email string container safely
    const finalEmailLink = "https://mail.google.com/mail/?view=cm&fs=1&to=" + 
                           encodeURIComponent(targetHR) + 
                           "&su=" + encodeURIComponent(mailSubject) + 
                           "&body=" + encodeURIComponent(mailBody);
    
    // Boot up the open window handler
    window.open(finalEmailLink, '_blank');

    setTimeout(function() {
        alert("Success!\n\n1. The contract has downloaded as: " + fileSaveName + "\n2. Gmail has opened a new tab pre-addressed to HR.\n3. Drag and drop the downloaded contract PDF into that email window and send!");
    }, 500);
}