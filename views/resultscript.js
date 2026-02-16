// Course details
const courses = {
    fullstack: {
        name: "Foundation + Product Development and DevOps",
        description: "Master full-stack development with Java/Python/MERN Stack, including DevOps tools and practices",
        modules: [
            "Basic Logic Building & Programming",
            "Data Structure & Algorithms",
            "Full Stack Development (JAVA/PYTHON/MERN)",
            "LLMs API Integration & Agentic AI",
            "Linux, Git, CI/CD Pipelines",
            "Docker, Kubernetes, Cloud (AWS/GCP)"
        ]
    },
    uiux: {
        name: "UI/UX, Artificial Intelligence and Data Science",
        description: "Comprehensive training in AI, Data Science, and modern design tools",
        modules: [
            "Generative AI - RAG, MCP, LLMs",
            "AI Agents and Orchestration",
            "Figma & Adobe XD",
            "PowerBI & Tableau",
            "Machine Learning & Deep Learning"
        ]
    },
    security: {
        name: "Cyber Security & Software Testing",
        description: "Expert training in security practices and comprehensive software testing",
        modules: [
            "Web & Network Security",
            "Vulnerability Assessment & Penetration Testing",
            "Manual & Automation Testing",
            "Performance Testing",
            "Selenium & Testing Frameworks"
        ]
    }
};

// Initialize results page
document.addEventListener('DOMContentLoaded', function () {
    loadResults();
});

function loadResults() {
    // Get results from localStorage
    const resultData = localStorage.getItem('testResult');

    if (!resultData) {
        alert('No test results found. Please take the test first.');
        window.location.href = 'test.html';
        return;
    }

    const result = JSON.parse(resultData);
    displayResults(result);
}

function displayResults(result) {
    // Display student name
    document.getElementById('studentName').textContent =
        `Congratulations, ${result.student.name}!`;

    // Display score
    const score = result.analysis.totalScore;
    const percentage = result.analysis.percentage;

    animateValue('scoreValue', 0, score, 2000);
    setTimeout(() => {
        document.getElementById('percentageValue').textContent = `${percentage.toFixed(1)}%`;
    }, 2000);

    // Display scholarship details
    displayScholarship(result.scholarship);

    // Display recommended course
    displayRecommendedCourse(result.student.course);

    // Display AI analysis
    displayConceptAnalysis(result.analysis.conceptProficiency);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function displayScholarship(scholarship) {
    document.getElementById('scholarshipPercent').textContent =
        `${scholarship.percentage}%`;
    document.getElementById('scholarshipAmount').textContent =
        `₹${scholarship.amount.toLocaleString('en-IN')}`;
    document.getElementById('finalFee').textContent =
        `₹${scholarship.finalFee.toLocaleString('en-IN')}`;
    document.getElementById('savingsAmount').textContent =
        `₹${scholarship.amount.toLocaleString('en-IN')}`;
}

function displayRecommendedCourse(courseKey) {
    const course = courses[courseKey];
    if (!course) return;

    const courseHTML = `
        <div class="course-card">
            <h4>${course.name}</h4>
            <p>${course.description}</p>
            <div style="margin-top: 15px;">
                <strong style="color: #667eea;">Course Modules:</strong>
                <ul style="margin-top: 10px; margin-left: 20px; color: #4a5568;">
                    ${course.modules.map(module => `<li style="margin-bottom: 8px;">${module}</li>`).join('')}
                </ul>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 10px;">
                <p style="color: #16a34a; font-weight: 600; margin-bottom: 5px;">
                    Certification Included
                </p>
                <p style="color: #16a34a; font-weight: 600;">
                    At least 5 Placement Drives Assured
                </p>
            </div>
        </div>
    `;

    document.getElementById('recommendedCourse').innerHTML = courseHTML;
}

function displayConceptAnalysis(conceptProficiency) {
    const container = document.getElementById('conceptAnalysis');
    container.innerHTML = '';

    // Sort concepts by proficiency score
    const sortedConcepts = Object.entries(conceptProficiency)
        .sort((a, b) => b[1].score - a[1].score);

    sortedConcepts.forEach(([concept, data]) => {
        const proficiencyLevel = getProficiencyLevel(data.score);
        const conceptHTML = `
            <div class="concept-item">
                <div class="concept-header">
                    <span class="concept-name">${concept}</span>
                    <span class="proficiency-badge proficiency-${proficiencyLevel.class}">
                        ${proficiencyLevel.label}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill progress-${proficiencyLevel.class}" 
                         style="width: ${data.score}%">
                    </div>
                </div>
                <p style="color: #718096; margin-bottom: 10px;">
                    Proficiency Score: ${data.score.toFixed(1)}%
                </p>
                ${data.gaps.length > 0 ? `
                    <div class="recommendations">
                        <h4>Areas for Improvement:</h4>
                        <ul>
                            ${data.gaps.map(gap => `<li>${gap}</li>`).join('')}
                        </ul>
                    </div>
                ` : `
                    <div style="background: #d1fae5; padding: 15px; border-radius: 10px; border-left: 4px solid #22c55e;">
                        <p style="color: #065f46; font-weight: 600;">
                            Excellent understanding! Keep up the great work.
                        </p>
                    </div>
                `}
            </div>
        `;
        container.innerHTML += conceptHTML;
    });
}

function getProficiencyLevel(score) {
    if (score >= 80) {
        return { label: 'Excellent', class: 'excellent' };
    } else if (score >= 60) {
        return { label: 'Good', class: 'good' };
    } else if (score >= 40) {
        return { label: 'Average', class: 'average' };
    } else {
        return { label: 'Needs Improvement', class: 'needs-improvement' };
    }
}

function contactUs() {
    window.open('tel:8977781696', '_blank');
}

function enrollNow() {
    const message = encodeURIComponent(
        'Hi! I just completed the scholarship test and would like to enroll in the course. My test ID: ' +
        Date.now()
    );
    window.open(`https://wa.me/918977781696?text=${message}`, '_blank');
}
