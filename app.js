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
    habits: [],
    recentActivity: []
};

// XP Values
const XP_VALUES = {
    easy: { min: 10, max: 25 },
    medium: { min: 25, max: 50 },
    hard: { min: 50, max: 100 }
};

// Rewards Store - Clean Text Only
const REWARDS_STORE = [
    { id: 'coffee', name: 'Coffee Break', icon: 'Coffee', cost: 5 },
    { id: 'snack', name: 'Favorite Snack', icon: 'Snack', cost: 8 },
    { id: 'music', name: '30min Music', icon: 'Music', cost: 10 },
    { id: 'gaming', name: '1 Hour Gaming', icon: 'Game', cost: 15 },
    { id: 'movie', name: 'Movie Night', icon: 'Film', cost: 20 },
    { id: 'book', name: 'New Book', icon: 'Book', cost: 30 },
    { id: 'treat', name: 'Special Treat', icon: 'Cake', cost: 25 },
    { id: 'outing', name: 'Fun Outing', icon: 'Fun', cost: 50 },
    { id: 'shopping', name: 'Shopping Spree', icon: 'Shop', cost: 75 },
    { id: 'experience', name: 'New Experience', icon: 'Star', cost: 100 }
];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadAppState();
    setupEventListeners();
    populateRewardsStore();
    updateUI();
    
    // Add sample data if first time
    if (appState.tasks.length === 0) {
        addSampleData();
    }
});

// Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab) {
                switchTab(tab.dataset.tab);
                tab.parentElement.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            } else if (tab.dataset.category) {
                filterTasks(tab.dataset.category);
                tab.parentElement.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            }
        });
    });
    
    // Form submissions
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('habitForm').addEventListener('submit', handleHabitSubmit);
    
    // Modal close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

// Local Storage
function saveAppState() {
    localStorage.setItem('reconnect-minimal', JSON.stringify(appState));
}

function loadAppState() {
    const saved = localStorage.getItem('reconnect-minimal');
    if (saved) {
        const parsedState = JSON.parse(saved);
        appState = { ...appState, ...parsedState };
    }
}

// Tab Management
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
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
    document.getElementById('taskForm').reset();
    
    showNotification('Task added! Time to get things done!', 'success');
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
    
    addRecentActivity(`Completed "${task.title}" (+${xpGained} XP)`);
    
    saveAppState();
    updateUI();
    
    showNotification(`Great job! +${xpGained} XP, +${creditsGained} credits`, 'success');
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
        taskList.innerHTML = '<p class="empty-state" style="text-align: center; padding: 2rem;">No tasks yet! Add your first task to get started</p>';
        return;
    }
    
    taskList.innerHTML = tasks.map(task => `
        <div class="task-item">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="${task.completed ? '' : `completeTask('${task.id}')`}"></div>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">${getCategoryName(task.category)} • ${task.difficulty}</div>
            </div>
            <div class="task-xp">+${task.xpValue} XP</div>
            <button onclick="deleteTask('${task.id}')" style="background: none; border: 1px solid var(--border-light); color: var(--text-muted); cursor: pointer; font-size: 12px; padding: 4px 8px; border-radius: 4px; margin-left: 8px;">Delete</button>
        </div>
    `).join('');
}

// Habit Management
function handleHabitSubmit(e) {
    e.preventDefault();
    
    const habitData = {
        id: Date.now().toString(),
        name: document.getElementById('habitName').value,
        icon: document.getElementById('habitIcon').value,
        target: parseInt(document.getElementById('habitTarget').value),
        streak: 0,
        completedDays: [],
        createdAt: new Date().toISOString()
    };
    
    appState.habits.push(habitData);
    saveAppState();
    updateUI();
    hideModal('habitModal');
    document.getElementById('habitForm').reset();
    
    showNotification('New habit created! Lets build it together!', 'success');
}

function toggleHabitDay(habitId) {
    const habit = appState.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const today = new Date().toDateString();
    const dayIndex = habit.completedDays.indexOf(today);
    
    if (dayIndex === -1) {
        habit.completedDays.push(today);
        habit.streak++;
        
        const xpGained = 15;
        const creditsGained = 3;
        
        appState.user.xp += xpGained;
        appState.user.totalXP += xpGained;
        appState.user.credits += creditsGained;
        
        addRecentActivity(`Completed habit "${habit.name}" (+${xpGained} XP)`);
        showNotification(`Habit completed! Keep it up!`, 'success');
    } else {
        habit.completedDays.splice(dayIndex, 1);
        habit.streak = Math.max(0, habit.streak - 1);
    }
    
    checkLevelUp();
    saveAppState();
    updateUI();
}

function renderHabits() {
    const habitGrid = document.getElementById('habitGrid');
    
    if (appState.habits.length === 0) {
        habitGrid.innerHTML = '<div class="clean-card content-spacing" style="text-align: center;"><p class="empty-state">No habits yet! Start building better routines today</p></div>';
        return;
    }
    
    habitGrid.innerHTML = appState.habits.map(habit => {
        const today = new Date().toDateString();
        const completedToday = habit.completedDays.includes(today);
        
        return `
            <div class="clean-card habit-card">
                <div class="habit-header">
                    <div class="habit-icon">${habit.icon}</div>
                    <div class="habit-info">
                        <h3>${habit.name}</h3>
                        <div class="habit-streak">${habit.streak} day streak</div>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(habit.streak / habit.target) * 100}%"></div>
                </div>
                
                <div style="margin-top: 1.5rem; text-align: center;">
                    <button class="btn ${completedToday ? 'btn-secondary' : 'btn-primary'}" 
                            onclick="toggleHabitDay('${habit.id}')">
                        ${completedToday ? 'Done Today' : 'Mark Complete'}
                    </button>
                </div>
                
                <div style="margin-top: 1rem; font-size: var(--font-size-sm); color: var(--text-secondary); text-align: center;">
                    ${habit.streak} / ${habit.target} days
                </div>
            </div>
        `;
    }).join('');
}

// Rewards System
function populateRewardsStore() {
    const rewardsGrid = document.getElementById('rewardsGrid');
    
    rewardsGrid.innerHTML = REWARDS_STORE.map(reward => `
        <div class="clean-card reward-card" onclick="redeemReward('${reward.id}')">
            <div class="reward-icon">${reward.icon}</div>
            <div class="reward-title">${reward.name}</div>
            <div class="reward-cost">${reward.cost} credits</div>
        </div>
    `).join('');
}

function redeemReward(rewardId) {
    const reward = REWARDS_STORE.find(r => r.id === rewardId);
    if (!reward) return;
    
    if (appState.user.credits < reward.cost) {
        showNotification('Need more credits! Complete tasks to earn them', 'error');
        return;
    }
    
    appState.user.credits -= reward.cost;
    addRecentActivity(`Redeemed "${reward.name}" (-${reward.cost} credits)`);
    
    saveAppState();
    updateUI();
    
    showNotification(`Reward claimed! Enjoy your ${reward.name}!`, 'success');
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
        showNotification(`Level Up! You're now Level ${newLevel}!`, 'success');
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

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
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
    
    appState.habits = [
        {
            id: '1',
            name: 'Drink water when I wake up',
            icon: 'Water',
            target: 7,
            streak: 2,
            completedDays: [],
            createdAt: new Date().toISOString()
        }
    ];
    
    appState.user.xp = 20;
    appState.user.totalXP = 20;
    appState.user.credits = 10;
    appState.user.streak = 1;
    
    appState.recentActivity = [
        { text: 'Completed "Take a 15-minute walk" (+20 XP)', timestamp: Date.now() },
        { text: 'Welcome to ReConnect!', timestamp: Date.now() - 60000 }
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
    document.getElementById('rewardsCredits').textContent = appState.user.credits;
    
    // Update level progress
    const currentLevelXP = getXPForLevel(appState.user.level);
    const nextLevelXP = getXPForNextLevel(appState.user.level);
    const progress = ((appState.user.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    document.getElementById('levelProgress').style.width = `${Math.min(progress, 100)}%`;
    
    // Update recent activity
    const recentActivityContainer = document.getElementById('recentActivity');
    if (appState.recentActivity && appState.recentActivity.length > 0) {
        recentActivityContainer.innerHTML = appState.recentActivity.map(activity => `
            <div class="activity-text" style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-light); font-size: var(--font-size-sm);">
                ${activity.text}
            </div>
        `).join('');
    }
    
    // Render components
    renderTasks();
    renderHabits();
}