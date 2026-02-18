const express = require('express');
const cors = require('cors');
const path = require('path');
// Anthropic SDK removed — using randomized evaluation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const questionsData = require('./config/professional-questions.json');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Added urlencoded

// Request logging middleware
app.use((req, res, next) => {
    const logFile = path.join(__dirname, 'server_requests.log');
    const msg = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    fs.appendFileSync(logFile, msg);
    next();
});

app.use(express.static(path.join(__dirname, 'views')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Serve React app (if built)
const reactBuildPath = path.join(__dirname, 'frontend', 'dist');
if (require('fs').existsSync(reactBuildPath)) {
    app.use('/app', express.static(reactBuildPath));
}

// Proxy to Python resume service
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || 'http://localhost:8000';

async function proxyToResumeService(req, res, endpoint) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${RESUME_SERVICE_URL}${endpoint}`, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            },
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Resume service proxy error:', error);
        res.status(503).json({
            error: 'Resume service unavailable',
            details: error.message
        });
    }
}

// Authentication middleware
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const token = authHeader.substring(7);

        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}

// AI client removed — using randomized evaluation

// Load questions
const fs = require('fs');
const questionsPath = path.join(__dirname, 'config', 'questions.json');
let questions = [];

// Temporary in-memory storage for last test result (fallback when DB fails)
const recentResults = new Map(); // userId -> result

try {
    const data = fs.readFileSync(questionsPath, 'utf8');
    const jsonData = JSON.parse(data);
    // Handle both formats: {questions: [...]} or {sections: [...]}
    if (jsonData.questions) {
        questions = jsonData.questions;
    } else if (jsonData.sections) {
        questions = jsonData; // Store whole object with sections
    } else {
        questions = [];
    }
    console.log('✅ Questions loaded:', questions.sections ? `${questions.sections.length} sections` : `${questions.length} questions`);
} catch (error) {
    console.error('❌ Error loading questions:', error);
}

// Scholarship calculation based on score percentage
function calculateScholarship(percentage) {
    const originalFee = 45000;
    let scholarshipPercentage;

    const percentageInt = parseInt(percentage);

    if (percentageInt >= 90) {
        scholarshipPercentage = 100; // 90-100 marks: 100% FREE
    } else if (percentageInt >= 80) {
        scholarshipPercentage = 60;  // 80-89 marks: 60% OFF
    } else if (percentageInt >= 70) {
        scholarshipPercentage = 50;  // 70-79 marks: 50% OFF
    } else if (percentageInt >= 50) {
        scholarshipPercentage = 40;  // 50-69 marks: 40% OFF
    } else if (percentageInt >= 35) {
        scholarshipPercentage = 25;  // 35-49 marks: 25% OFF
    } else {
        scholarshipPercentage = 15;  // Below 35: Minimum encouragement scholarship
    }

    const scholarshipAmount = (originalFee * scholarshipPercentage) / 100;
    const finalFee = originalFee - scholarshipAmount;

    return {
        percentage: scholarshipPercentage,
        amount: scholarshipAmount,
        finalFee: finalFee,
        originalFee: originalFee
    };
}

// Randomized evaluation (Claude LLM removed)

// Lead capture endpoint - stores user data in Supabase
app.post('/api/save-lead', requireAuth, async (req, res) => {
    try {
        const { phone, source } = req.body;
        const user = req.user;

        // Insert or update lead in Supabase
        const { data, error } = await supabase
            .from('leads')
            .upsert({
                user_id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                phone: phone || null,
                source: source || 'landing_page',
                avatar_url: user.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('❌ Error saving lead:', error);
            return res.status(500).json({ error: 'Failed to save lead data' });
        }

        console.log('✅ Lead saved:', user.email);
        res.json({ success: true, message: 'Lead data saved successfully' });
    } catch (error) {
        console.error('❌ Lead save error:', error);
        res.status(500).json({ error: 'Failed to save lead data' });
    }
});

// Admin Signup Endpoint (Bypasses IP Rate Limits)
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
            return res.status(500).json({
                error: 'Server configuration error. Service Role Key missing.'
            });
        }

        // Initialize Admin Client
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        console.log(`🔐 Attempting admin signup for: ${email}`);

        // Create user via Admin API (Bypasses Rate Limits)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for smoother testing
            user_metadata: { full_name }
        });

        if (error) {
            console.error('❌ Admin signup failed:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ User created via Admin API: ${data.user.id}`);

        // If successful, we might want to sign them in immediately to get a session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            // If sign in fails (weird, but possible), return success but ask to login
            return res.json({
                success: true,
                message: 'Account created successfully. Please log in.',
                user: data.user
            });
        }

        // Return the session so frontend can auto-login
        res.json({
            success: true,
            session: signInData.session,
            user: signInData.user
        });

    } catch (error) {
        console.error('❌ Signup endpoint error:', error);
        res.status(500).json({ error: 'Internal server error during signup' });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'test.html'));
});

app.get('/resume', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'resume.html'));
});

// Advanced Resume Builder (React App)
app.get('/builder/*', (req, res) => {
    const reactBuildPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
    if (require('fs').existsSync(reactBuildPath)) {
        res.sendFile(reactBuildPath);
    } else {
        res.status(503).send('Resume Builder not available. Please run: cd frontend && npm run build');
    }
});

// Resume service API proxy routes
app.post('/api/resume/process', requireAuth, (req, res) => {
    proxyToResumeService(req, res, '/process');
});

app.post('/api/resume/generate', requireAuth, (req, res) => {
    proxyToResumeService(req, res, '/generate');
});

app.get('/api/resume/status', (req, res) => {
    proxyToResumeService(req, res, '/');
});

app.get('/api/questions', (req, res) => {
    try {
        let selectedQuestions;

        // Check if questions are in sections format
        if (questions.sections) {
            // Flatten sections into single questions array
            selectedQuestions = [];
            questions.sections.forEach(section => {
                section.questions.forEach(q => {
                    selectedQuestions.push({
                        ...q,
                        section: section.name,
                        sectionId: section.id
                    });
                });
            });
        } else {
            // Direct array format
            selectedQuestions = questions.slice(0, 18);
        }

        res.json({ questions: selectedQuestions });
    } catch (error) {
        console.error('Error loading questions:', error);
        res.status(500).json({ error: 'Failed to load questions' });
    }
});

// --- New Dashboard API ---
app.get('/api/user-results', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('test_results')
            .select('id, score, scholarship_percentage, submitted_at, student_name')
            .eq('user_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, results: data });
    } catch (error) {
        console.error('Error fetching user results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/test-result/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('test_results')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('Error fetching single result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/submit-test', requireAuth, async (req, res) => {
    // Setup logging
    const logFile = path.join(__dirname, 'debug_error.log');
    const log = (msg) => {
        try {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
        } catch (e) { console.error('Logging failed:', e); }
    };

    try {
        log('--- NEW SUBMISSION STARTED ---');

        const userId = req.user.id;
        const userEmail = req.user.email;

        // Check for existing submission
        const { data: existingResult, error: checkError } = await supabase
            .from('test_results')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (checkError) {
            log(`Error checking existing results: ${checkError.message}`);
        }

        if (existingResult) {
            log(`User ${userId} already has a test result. Blocking submission.`);
            return res.status(403).json({
                error: 'Test already completed',
                message: 'You have already taken the FSAT once. Please check your dashboard for results.'
            });
        }

        const { student, answers, metadata, timeSpent } = req.body;

        log(`User: ${userId} (${userEmail}), Answers count: ${Object.keys(answers || {}).length}`);

        if (!answers || Object.keys(answers).length === 0) {
            log('Error: No answers provided');
            return res.status(400).json({ error: 'No answers provided' });
        }

        // Flatten all questions from all sections
        const allQuestions = questionsData.sections.flatMap(section => section.questions);
        log(`Loaded ${allQuestions.length} questions`);

        // Get questions that were answered
        const testQuestions = allQuestions.filter(q => answers[q.id]);
        log(`Evaluating ${testQuestions.length} answered questions`);

        // Randomized evaluation (no AI)
        let aiEvaluation;
        try {
            log('Using randomized evaluation...');
            aiEvaluation = generateMockEvaluation(answers, testQuestions);
        } catch (evalError) {
            log(`Evaluation Generation Failed: ${evalError.message}`);
            log(evalError.stack);
            throw evalError;
        }

        log('Evaluation generation successful');

        // Calculate scholarship
        const scholarship = calculateScholarship(aiEvaluation.percentage);
        log(`Scholarship calculated: ${scholarship.percentage}%`);

        // Prepare result (for response and in-memory cache)
        const result = {
            studentData: student, // Keep original student data structure
            evaluation: aiEvaluation,
            scholarship: scholarship,
            submittedAt: new Date().toISOString()
        };

        // Store test result in Supabase
        // Store test result in Supabase
        const { error: dbError } = await supabase
            .from('test_results')
            .insert({
                user_id: req.user.id,
                user_email: req.user.email,
                student_name: student.name,
                student_phone: student.phone,
                score: aiEvaluation.percentage,
                percentage: aiEvaluation.percentage,
                scholarship_percentage: scholarship.percentage,
                scholarship_amount: scholarship.amount,
                final_fee: scholarship.finalFee,
                answers: answers,
                evaluation: aiEvaluation,
                metadata: {
                    ...metadata,
                    college: student.college,
                    course: student.course,
                    year: student.year
                },
                submitted_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('⚠️  Failed to store test result in database:', dbError);
        } else {
            console.log('✅ Test result stored in Supabase');
        }

        // Update lead with phone number if provided
        if (student.phone) {
            await supabase
                .from('leads')
                .upsert({
                    user_id: req.user.id,
                    email: req.user.email,
                    name: student.name || req.user.user_metadata?.full_name,
                    phone: student.phone,
                    source: 'fsat_test',
                    avatar_url: req.user.user_metadata?.avatar_url,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });
        }


        console.log('📊 [Submit] ✅ Sending result to frontend...');
        console.log('📊 [Submit] Result keys:', Object.keys(result));

        // Store in memory as fallback (in case frontend fails to save)
        recentResults.set(req.user.id, {
            result: result,
            timestamp: new Date().toISOString()
        });
        console.log('📊 [Submit] ✅ Saved result in memory for user:', req.user.email);

        res.json(result);

        console.log('📊 [Submit] ✅✅✅ SUBMISSION COMPLETE ✅✅✅');
    } catch (error) {
        console.error('❌ [Submit] Test submission error:', error.message);
        console.error('❌ [Submit] Error type:', error.constructor.name);
        console.error('❌ [Submit] Full error:', error);

        res.status(500).json({
            error: error.message || 'Failed to process test submission. Please try again or contact support.',
            details: error.stack
        });
    }
});

// Mock Evaluation Function
// Mock Evaluation Function
function generateMockEvaluation(answers, questions) {
    let totalScore = 0;
    const maxScore = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const categoryScores = {};
    const dimensionScores = {
        "Technical Knowledge": 0, "Problem Solving": 0, "Analytical Thinking": 0,
        "Creativity": 0, "Debugging Skills": 0, "System Design": 0,
        "Communication": 0, "Collaboration": 0, "Security Awareness": 0, "Testing & QA": 0
    };

    // Calculate raw scores first
    const evaluations = questions.map(q => {
        let score = 0;
        let isCorrect = false;

        if (q.type === 'mcq') {
            const answerIndex = parseInt(answers[q.id]);
            if (answerIndex === q.correctAnswer) {
                score = q.marks;
                isCorrect = true;
            }
        } else {
            const hasAnswer = answers[q.id] && answers[q.id].length > 5;
            if (hasAnswer) {
                score = Math.floor(q.marks * (0.6 + Math.random() * 0.3));
                isCorrect = true;
            }
        }

        totalScore += score;
        return {
            questionId: q.id,
            score: score,
            maxScore: q.marks,
            isCorrect: isCorrect
        };
    });

    // --- SCORING LOGIC UPDATE (User Requested) ---
    // Calculate actual percentage based on correct answers
    let percentage = (totalScore / maxScore) * 100;

    // Logic:
    // 1. If score > 80%, keep it as is (merit based).
    // 2. If score <= 80%, randomize between 60% and 79% (fallback range).
    if (percentage > 80) {
        // Keep actual high score
        percentage = Math.round(percentage);
    } else {
        // Randomize between 60 and 79
        percentage = Math.floor(Math.random() * (79 - 60 + 1)) + 60;
    }

    // Ensure realistic bounds
    percentage = Math.min(100, Math.max(0, percentage));


    // --- RANDOMIZED FEEDBACK GENERATOR ---
    const introPhrases = [
        "Your assessment reveals a strong aptitude for",
        "The analysis indicates a promising potential in",
        "Your responses demonstrate a solid foundation in",
        "Evaluation confirms a good grasp of",
        "Our AI analysis highlights your capability in"
    ];

    const strengthAdjectives = ["excellent", "robust", "commanding", "proficient", "impressive"];
    const weakAdjectives = ["developing", "foundational", "evolving", "fundamental", "emerging"];

    // Update dimension scores based on new percentage
    Object.keys(dimensionScores).forEach(dim => {
        // Randomize dimension scores around user's percentage
        const variance = Math.floor(Math.random() * 15) - 7; // +/- 7%
        dimensionScores[dim] = Math.min(98, Math.max(45, percentage + variance));
    });

    // percentage check - ensure it's within realistic bounds but reflecting performance
    percentage = Math.max(1, Math.min(100, percentage));

    // Generate Feedback Text
    const intro = introPhrases[Math.floor(Math.random() * introPhrases.length)];
    const coreSkill = "Software Development logic";
    const overallFeedback = `${intro} ${coreSkill}. You scored ${percentage}%, placing you in a competitive percentile. While your ${Object.keys(dimensionScores)[0]} is ${strengthAdjectives[Math.floor(Math.random() * strengthAdjectives.length)]}, focusing on ${Object.keys(dimensionScores)[4]} will verify your expertise further.`;

    // Generate Strengths/Weaknesses from pool
    const strengthPool = [
        "Algorithmic Thinking", "Code Optimization approach", "Logical Reasoning",
        "Database concepts", "System Architecture basics", "Error handling logic",
        "Problem decomposition", "Time complexity awareness", "API design understanding"
    ];

    const weaknessPool = [
        "Edge case handling", "Scalability considerations", "Security best practices",
        "Advanced design patterns", "Cloud infrastructure concepts", "Testing methodologies",
        "Async programming nuances", "Memory management techniques"
    ];

    // Shuffle and pick 3
    const strengths = strengthPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    const weaknesses = weaknessPool.sort(() => 0.5 - Math.random()).slice(0, 3);

    return {
        evaluations, // Return raw evaluations but override totals
        totalScore: Math.round((percentage / 100) * maxScore),
        maxScore,
        percentage,
        dimensionScores,
        categoryPerformance: {}, // Simplified for mock
        overallFeedback,
        strengths,
        weaknesses,
        recommendedCourses: [
            { course: "Foundation Cohort", reason: "Recommended based on your score to solidify basics.", priority: "High" },
            { course: "Product Development", reason: "Excellent next step for your career.", priority: "Medium" }
        ],
        careerSuggestions: ["Full Stack Developer", "Software Engineer", "Backend Developer"]
    };
}


// Get last test result (fallback endpoint)
app.get('/api/get-last-result', requireAuth, (req, res) => {
    try {
        const userResult = recentResults.get(req.user.id);

        if (userResult) {
            console.log('📊 [Get Result] Returning cached result for:', req.user.email);
            res.json({
                success: true,
                result: userResult.result,
                timestamp: userResult.timestamp
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No recent test result found'
            });
        }
    } catch (error) {
        console.error('Error retrieving result:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve result'
        });
    }
});

app.post('/api/generate-resume', requireAuth, async (req, res) => {
    try {
        const { phone, name, email, education, skills, experience } = req.body;

        console.log('📄 Resume generation request from:', req.user.email);

        // Construct payload for Python service
        const resumePayload = {
            personal_info: {
                name: name || '',
                email: email || '',
                phone: phone || '',
                location: 'India' // Default location
            },
            education: [{
                institution: 'University / College', // Placeholder if parsing fails
                degree: education || '',
                start_date: '2020', // Default
                end_date: '2024',   // Default
                details: []
            }],
            experience: experience ? [{
                company: 'Key Project / Experience',
                role: 'Developer',
                start_date: '',
                end_date: '',
                details: [experience]
            }] : [],
            skills: [{
                category: 'Technical Skills',
                skills: (skills || '').split(',').map(s => s.trim()).filter(s => s)
            }],
            summary: `Motivated professional with expertise in ${skills || 'technology'}.`,
            custom_sections: []
        };

        let enhancedResume = resumePayload;

        try {
            // Call Python Resume Service
            console.log('🔄 Calling Python Resume Service...');
            const pythonServiceResponse = await fetch('http://localhost:8000/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resumePayload)
            });

            if (pythonServiceResponse.ok) {
                const data = await pythonServiceResponse.json();
                if (data.resume) {
                    enhancedResume = data.resume;
                    console.log('✅ Resume enhanced by Python service');
                }
            } else {
                console.warn('⚠️ Python service returned error:', pythonServiceResponse.status);
            }
        } catch (err) {
            console.error('❌ Failed to connect to Python service:', err.message);
            // Fallback to basic payload if service is down
        }

        // Generate Professional HTML Resume
        const resumeHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${enhancedResume.personal_info.name || 'Resume'}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #2c3e50;
                    --secondary: #34495e;
                    --accent: #2980b9;
                    --text: #333;
                    --text-light: #666;
                    --bg: #fff;
                    --border: #e0e0e0;
                }
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                body {
                    font-family: 'Inter', sans-serif;
                    line-height: 1.6;
                    color: var(--text);
                    background: var(--bg);
                    max-width: 850px;
                    margin: 0 auto;
                    padding: 40px;
                }
                
                /* Header */
                header {
                    border-bottom: 2px solid var(--primary);
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                
                .header-left h1 {
                    font-size: 32px;
                    color: var(--primary);
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .header-left p {
                    font-size: 16px;
                    color: var(--text-light);
                }

                .contact-info {
                    text-align: right;
                    font-size: 14px;
                    color: var(--text-light);
                }

                .contact-info div { margin-bottom: 3px; }

                /* Sections */
                section { margin-bottom: 25px; }

                h2 {
                    font-size: 18px;
                    color: var(--accent);
                    text-transform: uppercase;
                    border-bottom: 1px solid var(--border);
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                    font-weight: 700;
                }

                /* Summary */
                .summary { margin-bottom: 20px; text-align: justify; }

                /* Skills */
                .skills-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .skill-tag {
                    background: #f0f4f8;
                    color: var(--secondary);
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 500;
                    border: 1px solid #dae1e7;
                }

                /* Experience & Education */
                .item { margin-bottom: 15px; }
                
                .item-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                
                .item-title { font-weight: 700; color: var(--primary); }
                .item-date { font-size: 14px; color: var(--text-light); font-style: italic; }
                .item-subtitle { color: var(--secondary); font-weight: 500; margin-bottom: 5px; }
                
                ul { list-style-type: disc; margin-left: 20px; margin-top: 5px; }
                li { margin-bottom: 4px; font-size: 14.5px; }
                
                @media print {
                    body { padding: 0; }
                    /* Ensure background colors print */
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <header>
                <div class="header-left">
                    <h1>${enhancedResume.personal_info.name}</h1>
                    <p>Software Developer</p>
                </div>
                <div class="contact-info">
                    <div>${enhancedResume.personal_info.email}</div>
                    <div>${enhancedResume.personal_info.phone || ''}</div>
                    <div>${enhancedResume.personal_info.location || ''}</div>
                </div>
            </header>

            ${enhancedResume.summary ? `
            <section>
                <h2>Professional Summary</h2>
                <div class="summary">${enhancedResume.summary}</div>
            </section>` : ''}

            ${enhancedResume.skills && enhancedResume.skills.length > 0 ? `
            <section>
                <h2>Technical Skills</h2>
                <div class="skills-grid">
                    ${enhancedResume.skills.map(cat =>
            cat.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
        ).join('')}
                </div>
            </section>` : ''}

            ${enhancedResume.experience && enhancedResume.experience.length > 0 ? `
            <section>
                <h2>Experience</h2>
                ${enhancedResume.experience.map(exp => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${exp.role}</span>
                        <span class="item-date">${exp.start_date} - ${exp.end_date}</span>
                    </div>
                    <div class="item-subtitle">${exp.company} ${exp.location ? `| ${exp.location}` : ''}</div>
                    <ul>
                        ${exp.details.map(detail => `<li>${detail}</li>`).join('')}
                    </ul>
                </div>`).join('')}
            </section>` : ''}

            ${enhancedResume.projects && enhancedResume.projects.length > 0 ? `
            <section>
                <h2>Projects</h2>
                ${enhancedResume.projects.map(proj => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${proj.name}</span>
                        <span class="item-date">${proj.link ? `<a href="${proj.link}">Link</a>` : ''}</span>
                    </div>
                    <ul>
                        ${proj.details.map(detail => `<li>${detail}</li>`).join('')}
                    </ul>
                </div>`).join('')}
            </section>` : ''}

            ${enhancedResume.education && enhancedResume.education.length > 0 ? `
            <section>
                <h2>Education</h2>
                ${enhancedResume.education.map(edu => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${edu.degree}</span>
                        <span class="item-date">${edu.start_date} - ${edu.end_date}</span>
                    </div>
                    <div class="item-subtitle">${edu.institution}</div>
                    ${edu.details.length > 0 ? `<ul>${edu.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
                </div>`).join('')}
            </section>` : ''}
        </body>
        </html>`;

        // Store resume in Supabase
        try {
            const { error: dbError } = await supabase
                .from('resumes')
                .insert({
                    user_id: req.user.id,
                    user_email: req.user.email,
                    name: name,
                    phone: phone,
                    email: email,
                    education: education,
                    skills: skills,
                    experience: experience,
                    resume_html: resumeHTML,
                    generated_at: new Date().toISOString()
                });

            if (dbError) {
                console.error('⚠️  Failed to store resume in database:', dbError);
            } else {
                console.log('✅ Resume stored in Supabase');
            }

            // Update lead with phone number
            await supabase
                .from('leads')
                .upsert({
                    user_id: req.user.id,
                    email: req.user.email,
                    name: name || req.user.user_metadata?.full_name,
                    phone: phone,
                    source: 'resume_builder',
                    avatar_url: req.user.user_metadata?.avatar_url,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });
        } catch (dbError) {
            console.error('⚠️  Database error (non-critical):', dbError);
        }

        res.json({
            success: true,
            resume: resumeHTML,
            message: 'Resume generated successfully'
        });
    } catch (error) {
        console.error('❌ Resume generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate resume. Please try again or contact support.',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 ====================================');
    console.log('   FutureTech Server Started');
    console.log('====================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Landing page: http://localhost:${PORT}`);
    console.log(`📝 Test page: http://localhost:${PORT}/test`);
    console.log(`📄 Resume builder: http://localhost:${PORT}/resume`);

    console.log('✅ Randomized evaluation mode (no AI dependency)');

    // Check Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('⚠️  WARNING: Supabase credentials not set!');
        console.log('   Authentication features may not work properly.');
    } else {
        console.log('✅ Supabase configured');
    }

    console.log('====================================\n');
});
