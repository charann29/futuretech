// Test Configuration
const TESTSCRIPT_VERSION = 'v2.0-MCQ-FIX';
console.log('🚀 TestScript Version:', TESTSCRIPT_VERSION);

let testStartTime;
let timerInterval;
let warningCount = 3;
let cameraStream;
let studentData = {};
let testAnswers = {};
let questions = [];

// Questions Database (will be loaded from backend)
const sampleQuestions = [
    {
        id: "mcq1",
        type: "mcq",
        question: "A software project has 5 modules. Each module takes 8 hours to complete. If 2 developers work on different modules simultaneously, how many hours will it take to complete the entire project?",
        options: ["20 hours", "40 hours", "25 hours", "16 hours"],
        correctAnswer: 0,
        marks: 5,
        difficulty: "easy"
    },
    {
        id: "mcq2",
        type: "mcq",
        question: "In a sequence: 3, 9, 27, 81, ? - What comes next?",
        options: ["162", "243", "324", "405"],
        correctAnswer: 1,
        marks: 5,
        difficulty: "easy"
    },
    {
        id: "mcq3",
        type: "mcq",
        question: "Which data structure is best suited for implementing undo functionality?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correctAnswer: 1,
        marks: 5,
        difficulty: "easy"
    }
];

// Anti-Cheating Measures
let tabSwitchCount = 0;
let copyPasteAttempts = 0;

// ==========================================
// CORE FUNCTIONS (Moved to top for safety)
// ==========================================

// Load Questions from API
async function loadQuestions() {
    try {
        console.log('Loading questions from API...');
        const response = await fetch('/api/questions');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            questions = data.questions;
            console.log(`✅ Loaded ${questions.length} questions from API`);
        } else {
            console.warn('API returned invalid data, using sample questions');
            questions = sampleQuestions;
        }
    } catch (error) {
        console.error('Failed to load questions from API, using sample:', error);
        questions = sampleQuestions;
    }

    console.log(`Total questions loaded: ${questions.length}`);

    // Initialize question navigation with type indicators
    const navContainer = document.getElementById('questionsNav');
    if (navContainer) {
        navContainer.innerHTML = '';
        questions.forEach((q, index) => {
            const navItem = document.createElement('div');
            navItem.className = 'question-nav-item';

            // Add type icon
            let typeIcon = '';
            switch (q.type) {
                case 'mcq': typeIcon = '📝'; break;
                case 'fitb': case 'fill': typeIcon = '✍️'; break;
                case 'programming': typeIcon = '💻'; break;
                case 'debugging': typeIcon = '🐛'; break;
            }

            navItem.innerHTML = `<span style="font-size: 12px;">${typeIcon}</span> Q${index + 1}`;
            navItem.onclick = () => goToQuestion(index);
            navContainer.appendChild(navItem);
        });
    }

    // Load first question
    currentQuestionIndex = 0;
    displayQuestion(currentQuestionIndex);
}

// Display question
function displayQuestion(index) {
    if (!questions[index]) return;
    const q = questions[index];

    // Update question number and marks
    const questionNumber = document.getElementById('questionNumber') || document.getElementById('questionNumberDisplay');
    const questionMarks = document.getElementById('questionMarks') || document.getElementById('questionMarksDisplay');

    if (questionNumber) questionNumber.textContent = `Question ${index + 1}`;
    if (questionMarks) questionMarks.textContent = `${q.marks} Marks`;

    // Add question type badge
    let typeBadge = '';
    switch (q.type) {
        case 'mcq': typeBadge = '📝 Multiple Choice'; break;
        case 'fitb': case 'fill': typeBadge = '✍️ Fill in the Blank'; break;
        case 'programming': typeBadge = '💻 Programming'; break;
        case 'debugging': typeBadge = '🐛 Debugging'; break;
    }

    document.getElementById('questionText').innerHTML = `${typeBadge ? `<span style="background: #FFD700; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px; font-weight: bold;">${typeBadge}</span>` : ''}${q.question}`;

    // Show description/hints based on question type
    let descriptionHTML = '';
    if (q.description) {
        descriptionHTML = `<p style="margin: 10px 0; color: #666;">${q.description}</p>`;
    }

    if (q.type === 'programming' && q.hints && q.hints.length > 0) {
        descriptionHTML += '<div style="background: #fffbea; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0; border-radius: 4px;">';
        descriptionHTML += '<strong style="color: #f59e0b;">💡 Hints:</strong><ul style="margin: 5px 0 0 20px; padding: 0;">';
        q.hints.forEach(hint => descriptionHTML += `<li style="margin: 4px 0;">${hint}</li>`);
        descriptionHTML += '</ul></div>';
    }

    if (q.type === 'debugging' && q.buggyCode) {
        descriptionHTML += '<div style="background: #fee; border-left: 4px solid #DC0000; padding: 12px; margin: 10px 0; border-radius: 4px;">';
        descriptionHTML += '<strong style="color: #DC0000;">🐛 Code with Errors:</strong>';
        descriptionHTML += `<pre style="background: #fff; padding: 12px; margin: 8px 0; border-radius: 4px; overflow-x: auto; border: 1px solid #ddd;"><code>${q.buggyCode}</code></pre>`;
        descriptionHTML += '</div>';
    }

    document.getElementById('questionDescription').innerHTML = descriptionHTML;

    // Load saved answer if exists
    const savedAnswer = testAnswers[q.id] || '';
    const answerSection = document.querySelector('.answer-section');

    if (!answerSection) return;

    if (q.type === 'mcq' && q.options && q.options.length > 0) {
        let optionsHTML = '<div style="margin: 15px 0;">';
        q.options.forEach((option, idx) => {
            const isSelected = savedAnswer === idx.toString();
            optionsHTML += `
                <label class="mcq-option" style="display: block !important; padding: 15px !important; margin: 10px 0 !important; border: 2px solid ${isSelected ? '#3b82f6' : '#e0e0e0'} !important; border-radius: 8px !important; cursor: pointer !important; background: ${isSelected ? '#eff6ff' : 'white'} !important; transition: all 0.3s !important; font-size: 16px !important;">
                    <input type="radio" name="answer_${q.id}" value="${idx}" ${isSelected ? 'checked' : ''} style="margin-right: 12px !important; cursor: pointer !important; width: 18px !important; height: 18px !important; vertical-align: middle !important;">
                    <span style="vertical-align: middle !important;">${option}</span>
                </label>
            `;
        });
        optionsHTML += '</div>';
        answerSection.innerHTML = optionsHTML;

        setTimeout(() => {
            const radioButtons = document.querySelectorAll(`input[name="answer_${q.id}"]`);
            radioButtons.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    testAnswers[q.id] = e.target.value;
                    updateNavigation();
                    saveCurrentAnswer();
                    displayQuestion(currentQuestionIndex);
                });
            });
        }, 100);

    } else {
        let placeholder = 'Type your answer here...';
        let label = 'Your Answer:';
        let isSingleLine = false;

        if (q.type === 'fitb' || q.type === 'fill') {
            placeholder = 'Fill in the blank...';
            isSingleLine = true;
        } else if (q.type === 'programming') {
            placeholder = 'Write your code here...\n\n// Example:\nfunction myFunction() {\n    // Your code\n}';
            label = 'Your Code:';
        } else if (q.type === 'debugging') {
            placeholder = 'Explain the errors you found and provide the corrected code...';
            label = 'Your Answer (List errors and corrected code):';
        }

        if (isSingleLine) {
            answerSection.innerHTML = `
                <label class="answer-label">${label}</label>
                <input type="text" id="answerInput" class="answer-textarea" placeholder="${placeholder}" value="${savedAnswer}" style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 16px; margin-top: 10px;">
            `;
        } else {
            let rows = q.type === 'programming' || q.type === 'debugging' ? 15 : 5;
            answerSection.innerHTML = `
                <label class="answer-label">${label}</label>
                <textarea id="answerInput" class="answer-textarea" placeholder="${placeholder}" style="width: 100%; min-height: ${rows * 25}px; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; resize: vertical; margin-top: 10px;">${savedAnswer}</textarea>
            `;
        }
    }

    updateNavigation();
    updateQuestionCounter();
}

function goToQuestion(index) {
    saveCurrentAnswer();
    currentQuestionIndex = index;
    displayQuestion(currentQuestionIndex);
}

function saveCurrentAnswer() {
    if (!questions[currentQuestionIndex]) return;
    const q = questions[currentQuestionIndex];

    if (q.type === 'mcq') {
        const selectedRadio = document.querySelector(`input[name="answer_${q.id}"]:checked`);
        if (selectedRadio) testAnswers[q.id] = selectedRadio.value;
    } else {
        const answerElement = document.getElementById('answerInput');
        if (answerElement && answerElement.value.trim()) {
            testAnswers[q.id] = answerElement.value.trim();
        }
    }
}

function updateNavigation() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');

    if (btnPrev) btnPrev.disabled = currentQuestionIndex === 0;
    if (btnNext) btnNext.style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'block';
    if (btnSubmit) btnSubmit.style.display = currentQuestionIndex === questions.length - 1 ? 'block' : 'none';

    document.querySelectorAll('.question-nav-item').forEach((item, idx) => {
        item.classList.remove('active');
        if (idx === currentQuestionIndex) item.classList.add('active');
        if (testAnswers[questions[idx]?.id]) item.classList.add('answered');
    });
}

function updateQuestionCounter() {
    document.getElementById('currentQ').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQ').textContent = questions.length;
}

// ==========================================
// END CORE FUNCTIONS
// ==========================================

// Initialize camera
async function initCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
        document.getElementById('cameraFeed').srcObject = cameraStream;
    } catch (error) {
        alert('Camera access is required for the test. Please allow camera permission and refresh the page.');
        console.error('Camera error:', error);
    }
}

// Initialize onboarding with user data
async function initializeOnboarding() {
    // Get user from auth
    if (window.authManager && window.authManager.getUser()) {
        const user = window.authManager.getUser();

        // Pre-fill form with user data
        const nameField = document.getElementById('onboardName');
        if (nameField) {
            nameField.value = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
        }
    }
}

// Handle onboarding form submission
async function handleOnboardingSubmit(e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('onboardName').value.trim();
    const phone = document.getElementById('onboardPhone').value.trim();
    const college = document.getElementById('onboardCollege').value.trim() || 'Not specified';
    const course = document.getElementById('onboardCourse').value.trim() || 'Not specified';
    const year = document.getElementById('onboardYear').value.trim();

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }

    // Validate year
    const yearNum = parseInt(year);
    if (!year || yearNum < 1990 || yearNum > 2030) {
        alert('Please enter a valid year of passing out (1990-2030)');
        return;
    }

    // Save student data
    const email = window.authManager?.getUser()?.email || 'test@example.com';
    studentData = { name, email, phone, college, course, year };

    // Save lead data to backend
    try {
        const session = await window.supabase.auth.getSession();
        const token = session?.data?.session?.access_token;

        if (token) {
            await fetch('/api/save-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: phone,
                    source: 'fsat_test_start'
                })
            });
        }
    } catch (error) {
        console.error('Error saving lead:', error);
    }

    // Hide onboarding overlay
    document.getElementById('onboardingOverlay').classList.add('hidden');

    // Load questions - NOW SAFE TO CALL
    loadQuestions();

    // Start timer (45 minutes = 2700 seconds)
    startTimer(2700);

    // Enable anti-cheating measures
    enableAntiCheat();
}

function setupNavigationHandlers() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');

    if (btnPrev) {
        btnPrev.onclick = () => {
            if (currentQuestionIndex > 0) {
                saveCurrentAnswer();
                currentQuestionIndex--;
                displayQuestion(currentQuestionIndex);
            }
        };
    }

    if (btnNext) {
        btnNext.onclick = () => {
            if (currentQuestionIndex < questions.length - 1) {
                saveCurrentAnswer();
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
            }
        };
    }

    if (btnSubmit) {
        btnSubmit.onclick = () => {
            saveCurrentAnswer();
            submitTest();
        };
    }
}


// Track current question
let currentQuestionIndex = 0;


// Timer
function startTimer(seconds) {
    testStartTime = Date.now();
    let remainingTime = seconds;

    timerInterval = setInterval(() => {
        remainingTime--;

        const minutes = Math.floor(remainingTime / 60);
        const secs = remainingTime % 60;

        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            autoSubmitTest();
        }
    }, 1000);
}

// Anti-Cheating Measures
function enableAntiCheat() {
    // Detect tab switch
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent right click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showWarning('Right-click is disabled during the test.');
    });

    // Detect keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            showWarning('Developer tools are not allowed during the test.');
        }
    });

    // Prevent text selection in certain areas
    document.querySelectorAll('.question-text, .question-description').forEach(el => {
        el.style.userSelect = 'none';
    });
}

function handleVisibilityChange() {
    if (document.hidden) {
        tabSwitchCount++;
        warningCount--;
        updateWarningCounter();
        showWarning(`Tab switching detected! You switched tabs/windows. Warnings remaining: ${warningCount}`);

        if (warningCount <= 0) {
            autoSubmitTest('Test auto-submitted due to excessive warnings.');
        }
    }
}

function handlePaste(e) {
    e.preventDefault();
    copyPasteAttempts++;
    warningCount--;
    updateWarningCounter();
    showWarning(`Copy-paste detected! Please type your answers. Warnings remaining: ${warningCount}`);

    if (warningCount <= 0) {
        autoSubmitTest('Test auto-submitted due to excessive warnings.');
    }
}

function updateWarningCounter() {
    const counter = document.getElementById('warningCounter');
    if (counter) {
        counter.textContent = `${Math.max(0, warningCount)}/3`;
    }
}

// Warning Modal
function showWarning(message) {
    document.getElementById('warningMessage').textContent = message;
    document.getElementById('warningModal').style.display = 'flex';
}

function closeWarning() {
    document.getElementById('warningModal').style.display = 'none';
}

// Custom Modal Functions
function showCustomModal(title, message, confirmText = 'OK', onConfirm = null, showCancel = true) {
    const modal = document.getElementById('customModal');
    if (!modal) {
        // Fallback
        alert(message);
        return;
    }

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;

    const confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.textContent = confirmText;
    confirmBtn.onclick = onConfirm ? () => { closeCustomModal(); onConfirm(); } : closeCustomModal;

    const cancelBtn = document.querySelector('.modal-btn-cancel');
    if (showCancel) {
        cancelBtn.style.display = 'block';
        cancelBtn.parentElement.style.justifyContent = 'space-between';
    } else {
        cancelBtn.style.display = 'none';
        cancelBtn.parentElement.style.justifyContent = 'center';
    }

    modal.style.display = 'flex';
}

function showErrorModal(message) {
    showCustomModal('Notice', message, 'OK', null, false);
}

function closeCustomModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function confirmSubmitTest() {
    closeCustomModal();
    collectAnswers();
    await processSubmission();
}

// Submit Test
function submitTest() {
    showCustomModal(
        'Ready to Submit?',
        'Are you sure you want to finish the test? You won\'t be able to change your answers after this.',
        'Yes, Submit Test',
        confirmSubmitTest,
        true
    );
}

function autoSubmitTest(reason = 'Time limit reached') {
    showErrorModal(reason);
    collectAnswers();
    processSubmission();
}

/**
 * ... [Existing collectAnswers function] ...
 */
function collectAnswers() {
    // Save current answer before collecting all
    saveCurrentAnswer();

    console.log('📊 Collecting answers...');
    console.log('Current testAnswers:', testAnswers);

    const answeredCount = Object.keys(testAnswers).filter(k => testAnswers[k]).length;
    console.log(`✅ ${answeredCount} questions answered out of ${questions.length}`);
}

async function processSubmission() {
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Stop camera
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }

    // Show loader
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }

    // Prepare submission data
    const submissionData = {
        student: studentData,
        answers: testAnswers,
        metadata: {
            submittedAt: new Date().toISOString(),
            duration: Math.floor((Date.now() - testStartTime) / 1000),
            tabSwitches: tabSwitchCount,
            copyPasteAttempts: copyPasteAttempts,
            warningsRemaining: warningCount
        }
    };

    try {
        // Get auth token from Supabase
        const session = await window.supabase.auth.getSession();
        const token = session?.data?.session?.access_token;

        if (!token) {
            showErrorModal('Authentication required. Please sign in again.');
            window.location.href = 'index.html';
            return;
        }

        // Send to backend for AI analysis
        const response = await fetch('/api/submit-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(submissionData)
        });

        console.log('[Submit] Response status:', response.status);
        console.log('[Submit] Response ok:', response.ok);

        const result = await response.json();
        console.log('[Submit] Parsed result:', result);

        // Check for server errors
        if (!response.ok) {
            console.error('[Submit] Server returned error');
            let errorMessage = result.error || 'Submission failed';

            if (result.code === 'API_KEY_MISSING') {
                errorMessage = 'AI Evaluation Service Unavailable. Your answers have been recorded but cannot be evaluated at this time.';
            }

            throw new Error(errorMessage);
        }

        // Response is OK, save and redirect
        console.log('[Submit] ✅ Test submitted successfully!');

        try {
            const resultString = JSON.stringify(result);
            localStorage.setItem('testResult', resultString);
            window.location.href = 'results.html';
        } catch (storageError) {
            console.error('[Submit] ❌ localStorage error:', storageError);
            showErrorModal('Results received but failed to save locally. Redirecting anyway...');
            setTimeout(() => { window.location.href = 'results.html'; }, 2000);
        }
    } catch (error) {
        console.error('Submission error:', error);

        // Show user-friendly error message
        let errorMessage = 'There was an error submitting your test. Please contact support.';

        if (error.message && error.message.includes('AI Evaluation Service Unavailable')) {
            errorMessage = error.message;
        } else if (error.message && error.message.includes('Authentication')) {
            errorMessage = 'Your session has expired. Please refresh the page and sign in again.';
        } else if (!navigator.onLine) {
            errorMessage = 'No Internet Connection. Please check your internet connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }

        showErrorModal(errorMessage);
    }
}

// Prevent page refresh/close during test
window.addEventListener('beforeunload', (e) => {
    const onboardingVisible = !document.getElementById('onboardingOverlay')?.classList.contains('hidden');
    if (!onboardingVisible) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Setup onboarding form
    const onboardingForm = document.getElementById('onboardingForm');
    if (onboardingForm) {
        onboardingForm.addEventListener('submit', handleOnboardingSubmit);
    }

    // Pre-fill user data after auth check
    setTimeout(() => {
        initializeOnboarding();
    }, 500);
});

// ===== ENHANCED UI FUNCTIONS =====

// Question statuses
let questionStatuses = {}; // { questionId: 'answered' | 'not-answered' | 'marked' }
let markedQuestions = new Set();

// Populate Question Palette
function populateQuestionPalette() {
    const paletteContainer = document.getElementById('questionPalette');
    if (!paletteContainer) return;

    paletteContainer.innerHTML = '';

    questions.forEach((q, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item not-answered';
        questionItem.innerHTML = `
            <div class="question-item-number">Q${index + 1}</div>
            <div class="question-item-marks">${q.marks}M</div>
        `;
        questionItem.onclick = () => goToQuestion(index);
        questionItem.dataset.index = index;
        questionItem.dataset.questionId = q.id;
        paletteContainer.appendChild(questionItem);

        // Initialize status
        questionStatuses[q.id] = 'not-answered';
    });

    updateQuestionPaletteUI();
}

// Update Question Palette UI
function updateQuestionPaletteUI() {
    const paletteItems = document.querySelectorAll('.question-item');

    paletteItems.forEach((item, index) => {
        const questionId = questions[index]?.id;

        // Remove all status classes
        item.classList.remove('active', 'answered', 'not-answered', 'marked');

        // Add current status
        if (index === currentQuestionIndex) {
            item.classList.add('active');
        } else if (markedQuestions.has(questionId)) {
            item.classList.add('marked');
        } else if (testAnswers[questionId] && testAnswers[questionId].trim().length > 0) {
            item.classList.add('answered');
        } else {
            item.classList.add('not-answered');
        }
    });

    updateProgressStats();
}

// Update Progress Stats
function updateProgressStats() {
    const answeredCount = Object.values(testAnswers).filter(a => a && a.trim().length > 0).length;
    const totalCount = questions.length;
    const remaining = totalCount - answeredCount;
    const progressPercentage = (answeredCount / totalCount) * 100;

    // Update numbers
    document.getElementById('answeredCount').textContent = answeredCount;
    document.getElementById('notAnsweredCount').textContent = remaining;

    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progressPercentage + '%';
    }

    // Update total question counter
    document.getElementById('totalQ').textContent = totalCount;
}

// Mark for Review Button Handler
function handleMarkForReview() {
    if (!questions[currentQuestionIndex]) return;

    const questionId = questions[currentQuestionIndex].id;

    if (markedQuestions.has(questionId)) {
        markedQuestions.delete(questionId);
    } else {
        markedQuestions.add(questionId);
    }

    updateQuestionPaletteUI();
    showAutoSave();
}

// Enhanced Display Question - FIXED TO SUPPORT MCQs
const originalDisplayQuestion = displayQuestion;
displayQuestion = function (index) {
    console.log('[Enhanced displayQuestion] Called with index:', index, 'Version:', TESTSCRIPT_VERSION);

    if (!questions[index]) {
        console.error('[Enhanced displayQuestion] No question at index:', index);
        return;
    }

    const q = questions[index];
    console.log('[Enhanced displayQuestion] Question type:', q.type, 'Has options:', !!q.options);

    // CALL THE ORIGINAL displayQuestion FUNCTION THAT HANDLES MCQs PROPERLY
    originalDisplayQuestion(index);

    // After original displayQuestion handles rendering, we just update the enhanced UI elements
    updateQuestionPaletteUI();

    // Update Mark button text
    const btnMark = document.getElementById('btnMark');
    if (btnMark) {
        if (markedQuestions.has(q.id)) {
            btnMark.textContent = '✓ Marked';
            btnMark.style.background = '#10b981';
            btnMark.style.color = 'white';
        } else {
            btnMark.textContent = '⭐ Mark for Review';
            btnMark.style.background = '#f59e0b';
            btnMark.style.color = 'black';
        }
    }

    console.log('[Enhanced displayQuestion] ✅ Complete');
}

// Enhanced Load Questions
const originalLoadQuestions = loadQuestions;
loadQuestions = async function () {
    await originalLoadQuestions();

    // Initialize enhanced UI
    populateQuestionPalette();

    // Display first question
    currentQuestionIndex = 0;
    displayQuestion(currentQuestionIndex);

    // Setup navigation handlers
    setupNavigationHandlers();

    // Update user info
    if (window.authManager && window.authManager.getUser()) {
        const user = window.authManager.getUser();
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) {
            userNameEl.textContent = user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                'Test Taker';
        }

        if (userAvatarEl && user.user_metadata?.avatar_url) {
            userAvatarEl.src = user.user_metadata.avatar_url;
        }
    }

    console.log('[Test] All questions loaded and UI initialized');
}

// Enhanced Save Current Answer
const originalSaveCurrentAnswer = saveCurrentAnswer;
saveCurrentAnswer = function () {
    if (!questions[currentQuestionIndex]) return;

    const q = questions[currentQuestionIndex];
    let answer = null;

    // Handle MCQ questions differently
    if (q.type === 'mcq') {
        const selectedRadio = document.querySelector(`input[name="answer_${q.id}"]:checked`);
        if (selectedRadio) {
            answer = selectedRadio.value;
            testAnswers[q.id] = answer;
            questionStatuses[q.id] = 'answered';
            console.log('[Save] MCQ answer saved:', answer);
        } else {
            questionStatuses[q.id] = 'not-answered';
        }
    } else {
        // For text-based questions (FITB, Programming, Debugging)
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answer = answerInput.value.trim();
            if (answer) {
                testAnswers[q.id] = answer;
                questionStatuses[q.id] = 'answered';
                console.log('[Save] Text answer saved:', answer.substring(0, 50) + '...');
            } else {
                questionStatuses[q.id] = 'not-answered';
            }
        }
    }

    updateQuestionPaletteUI();
    showAutoSave();
}

// Show Auto-save Indicator
function showAutoSave() {
    const autoSaveEl = document.getElementById('autoSave');
    if (autoSaveEl) {
        autoSaveEl.classList.add('show');
        setTimeout(() => {
            autoSaveEl.classList.remove('show');
        }, 2000);
    }
}

// Enhanced Timer
const originalStartTimer = startTimer;
startTimer = function (seconds) {
    testStartTime = Date.now();
    let remainingTime = seconds;

    timerInterval = setInterval(() => {
        remainingTime--;

        const minutes = Math.floor(remainingTime / 60);
        const secs = remainingTime % 60;

        const timerEl = document.getElementById('timerTime');
        const timerDisplayEl = document.getElementById('timerDisplay');

        if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // Add warning class when < 5 minutes
        if (remainingTime <= 300 && timerDisplayEl) {
            timerDisplayEl.classList.add('warning');
        }

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            autoSubmitTest();
        }
    }, 1000);
}

// Auto-save on input
let autoSaveTimeout;
document.addEventListener('DOMContentLoaded', () => {
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                saveCurrentAnswer();
            }, 1000);
        });
    }

    // Mark for Review button
    const btnMark = document.getElementById('btnMark');
    if (btnMark) {
        btnMark.addEventListener('click', handleMarkForReview);
    }
});

// Enhanced Navigation Updates
updateNavigation = function () {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');

    if (btnPrev) btnPrev.disabled = currentQuestionIndex === 0;
    if (btnNext) btnNext.style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'inline-block';
    if (btnSubmit) btnSubmit.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';
}

updateQuestionCounter = function () {
    document.getElementById('currentQ').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQ').textContent = questions.length;
}

console.log('[Enhanced UI] Professional test interface loaded');

