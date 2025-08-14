// Application State
let appState = {
    user: {
        level: 1,
        xp: 0,
        totalXP: 0,
        credits: 0,
        streak: 0
    },
    tasks: [],
    recentActivity: []
};

// XP Values
const XP_VALUES = {
    easy: { min: 10, max: 25 },
    medium: { min: 25, max: 50 },
    hard: { min: 50, max: 100 }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadAppState();
    setupEventListeners();
    updateUI();
    
    // Add sample data if first time
    if (appState.tasks.length === 0) {
        addSampleData();
    }
});

// Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab) {
                switchTab(btn.dataset.tab);
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.category) {
                filterTasks(btn.dataset.category);
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
    
    // Form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
}

// Tab Management
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    if (modalId === 'taskModal') {
        document.getElementById('taskForm').reset();
    }
}

// Local Storage
function saveAppState() {
    localStorage.setItem('reconnect-data', JSON.stringify(appState));
}

function loadAppState() {
    const saved = localStorage.getItem('reconnect-data');
    if (saved) {
        appState = JSON.parse(saved);
    }
}

// Task Management
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        id: Date.now().toString(),
        title: document.getElementById('taskTitle').value,
        category: document.getElementById('taskCategory').value,
        difficulty: document.getElementById('taskDifficulty').value,
        completed: false,
        createdAt: new Date().toISOString(),
        xpValue: calculateXP(document.getElementById('taskDifficulty').value)
    };
    
    appState.tasks.push(taskData);
    saveAppState();
    updateUI();
    hideModal('taskModal');
    
    alert('Task added!');
}

function calculateXP(difficulty) {
    const range = XP_VALUES[difficulty];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function completeTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    task.completed = true;
    task.completedAt = new Date().toISOString();
    
    // Award XP and credits
    const xpGained = task.xpValue;
    const creditsGained = Math.floor(xpGained / 5);
    
    appState.user.xp += xpGained;
    appState.user.totalXP += xpGained;
    appState.user.credits += creditsGained;
    
    // Check level up
    checkLevelUp();
    updateStreak();
    
    addRecentActivity(`Completed task: "${task.title}" (+${xpGained} XP)`);
    
    saveAppState();
    updateUI();
    
    alert(`Task completed! +${xpGained} XP`);
}

function deleteTask(taskId) {
    appState.tasks = appState.tasks.filter(t => t.id !== taskId);
    saveAppState();
    updateUI();
}

function filterTasks(category) {
    const tasks = category === 'all' ? appState.tasks : appState.tasks.filter(t => t.category === category);
    renderTasks(tasks);
}

function renderTasks(tasks = appState.tasks) {
    const taskList = document.getElementById('taskList');
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; padding: 20px;">No tasks yet!</p>';
        return;
    }
    
    taskList.innerHTML = tasks.map(task => `
        <div class="task-item">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="${task.completed ? '' : `completeTask('${task.id}')`}"></div>
            <div class="task-content">
                <div><b>${task.title}</b></div>
                <div>${getCategoryName(task.category)} - ${task.difficulty} (${task.xpValue} XP)</div>
            </div>
            <button onclick="deleteTask('${task.id}')">Delete</button>
        </div>
    `).join('');
}

// Level System
function checkLevelUp() {
    const newLevel = calculateLevel(appState.user.totalXP);
    if (newLevel > appState.user.level) {
        appState.user.level = newLevel;
        appState.user.xp = appState.user.totalXP - getXPForLevel(newLevel);
        
        const creditsReward = newLevel * 5;
        appState.user.credits += creditsReward;
        
        addRecentActivity(`Level Up! Now Level ${newLevel} (+${creditsReward} credits)`);
        alert(`Level Up! You're now Level ${newLevel}!`);
    }
}

function calculateLevel(totalXP) {
    return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

function getXPForLevel(level) {
    return (level - 1) * (level - 1) * 50;
}

function getXPForNextLevel(level) {
    return level * level * 50;
}

// Streak System
function updateStreak() {
    const today = new Date().toDateString();
    const todayTasks = appState.tasks.filter(t => t.completed && new Date(t.completedAt).toDateString() === today);
    
    if (todayTasks.length > 0) {
        appState.user.streak = Math.max(appState.user.streak, 1);
    }
}

// Utility Functions
function getCategoryName(category) {
    const names = {
        personal: 'Personal',
        health: 'Health',
        work: 'Work',
        learning: 'Learning',
        home: 'Home'
    };
    return names[category] || category;
}

function addRecentActivity(activity) {
    appState.recentActivity.unshift({
        text: activity,
        timestamp: Date.now()
    });
    
    // Keep only last 8 activities
    appState.recentActivity = appState.recentActivity.slice(0, 8);
}

// Sample Data
function addSampleData() {
    appState.tasks = [
        {
            id: '1',
            title: 'Take a 15-minute walk',
            category: 'health',
            difficulty: 'easy',
            completed: true,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            xpValue: 20
        },
        {
            id: '2',
            title: 'Read 5 pages of a book',
            category: 'learning',
            difficulty: 'easy',
            completed: false,
            createdAt: new Date().toISOString(),
            xpValue: 15
        }
    ];
    
    appState.user.xp = 20;
    appState.user.totalXP = 20;
    appState.user.credits = 10;
    appState.user.streak = 1;
    
    appState.recentActivity = [
        { text: 'Completed task: "Take a 15-minute walk" (+20 XP)', timestamp: Date.now() },
        { text: 'Welcome to ReConnect', timestamp: Date.now() - 60000 }
    ];
    
    saveAppState();
}

// Update UI
function updateUI() {
    // Update header stats
    document.getElementById('userLevel').textContent = appState.user.level;
    document.getElementById('userXP').textContent = appState.user.xp;
    document.getElementById('userXPNext').textContent = getXPForNextLevel(appState.user.level) - getXPForLevel(appState.user.level);
    
    // Update dashboard stats
    document.getElementById('todayXP').textContent = appState.user.xp;
    document.getElementById('completedTasks').textContent = appState.tasks.filter(t => t.completed).length;
    document.getElementById('currentStreak').textContent = appState.user.streak;
    document.getElementById('totalCredits').textContent = appState.user.credits;
    
    // Update level progress
    const currentLevelXP = getXPForLevel(appState.user.level);
    const nextLevelXP = getXPForNextLevel(appState.user.level);
    const progress = ((appState.user.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    document.getElementById('levelProgress').style.width = `${Math.min(progress, 100)}%`;
    
    // Update recent activity
    const recentActivityContainer = document.getElementById('recentActivity');
    if (appState.recentActivity && appState.recentActivity.length > 0) {
        recentActivityContainer.innerHTML = appState.recentActivity.map(activity => `
            <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                ${activity.text}
            </div>
        `).join('');
    }
    
    // Render tasks
    renderTasks();
}