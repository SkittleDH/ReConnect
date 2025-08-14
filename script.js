// App data storage
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

// XP config - each difficulty has min and max values
const XP_VALUES = {
    easy: { min: 10, max: 25 },
    medium: { min: 25, max: 50 },
    hard: { min: 50, max: 100 }
};

// List of available rewards
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

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadAppState();
    setupEventListeners();
    populateRewardsStore();
    updateUI();
    
    // Add example data if first time
    if (appState.tasks.length === 0) {
        addSampleData();
    }
});

// Set up all event handlers
function setupEventListeners() {
    // Navigation tabs
    let tabs = document.querySelectorAll('.nav-tab');
    for(let tab of tabs) {
        tab.addEventListener('click', function() {
            if (this.dataset.tab) {
                switchTab(this.dataset.tab);
                // Remove active class from all tabs in this group
                let siblings = this.parentElement.querySelectorAll('.nav-tab');
                for(let sibling of siblings) {
                    sibling.classList.remove('active');
                }
                this.classList.add('active');
            } else if (this.dataset.category) {
                filterTasks(this.dataset.category);
                // Remove active class from all tabs in this group
                let siblings = this.parentElement.querySelectorAll('.nav-tab');
                for(let sibling of siblings) {
                    sibling.classList.remove('active');
                }
                this.classList.add('active');
            }
        });
    }
    
    // Form submissions
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('habitForm').addEventListener('submit', handleHabitSubmit);
    
    // Close modals when clicking outside content
    let modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            // Only close if clicking the background, not the content
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

// Save app data to localStorage
function saveAppState() {
    try {
        localStorage.setItem('reconnect-app-data', JSON.stringify(appState));
    } catch (e) {
        // Just ignore if localStorage is unavailable
        console.log("Couldn't save to local storage");
    }
}

// Load app data from localStorage
function loadAppState() {
    try {
        const saved = localStorage.getItem('reconnect-app-data');
        if (saved) {
            // Merge saved data with default state
            const parsedState = JSON.parse(saved);
            appState = { ...appState, ...parsedState };
        }
    } catch (e) {
        // Use default state if there's any error
        console.log("Couldn't load from local storage");
    }
}

// Switch between main tabs
function switchTab(tabName) {
    // Hide all tabs
    let tabContents = document.querySelectorAll('.tab-content');
    for(let content of tabContents) {
        content.classList.remove('active');
    }
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Show a modal dialog
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

// Hide a modal dialog
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Handle task form submission
function handleTaskSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('taskTitle').value;
    const category = document.getElementById('taskCategory').value;
    const difficulty = document.getElementById('taskDifficulty').value;
    
    // Calculate XP value based on difficulty
    const xp = calculateXP(difficulty);
    
    // Create task object
    const task = {
        id: Date.now().toString(), // Use timestamp as ID
        title: title,
        category: category,
        difficulty: difficulty,
        completed: false,
        createdAt: new Date().toISOString(),
        xpValue: xp
    };
    
    // Add to tasks array
    appState.tasks.push(task);
    saveAppState();
    updateUI();
    
    // Close modal and reset form
    hideModal('taskModal');
    document.getElementById('taskForm').reset();
    
    showNotification('Task added! Time to get things done!', 'success');
}

// Generate random XP value based on difficulty
function calculateXP(difficulty) {
    const range = XP_VALUES[difficulty];
    // Random number between min and max
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

// Mark a task as completed
function completeTask(taskId) {
    // Find the task by ID
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    // Mark as completed
    task.completed = true;
    task.completedAt = new Date().toISOString();
    
    // Award XP and credits
    const xpGained = task.xpValue;
    // Convert XP to credits (5 XP = 1 credit)
    const creditsGained = Math.floor(xpGained / 5);
    
    // Update user stats
    appState.user.xp += xpGained;
    appState.user.totalXP += xpGained;
    appState.user.credits += creditsGained;
    
    // Check if user leveled up
    checkLevelUp();
    updateStreak();
    
    // Record the activity
    addRecentActivity(`Completed "${task.title}" (+${xpGained} XP)`);
    
    // Save changes and update UI
    saveAppState();
    updateUI();
    
    // Show notification
    showNotification(`Great job! +${xpGained} XP, +${creditsGained} credits`, 'success');
}

// Delete a task
function deleteTask(taskId) {
    appState.tasks = appState.tasks.filter(t => t.id !== taskId);
    saveAppState();
    updateUI();
}

// Filter tasks by category
function filterTasks(category) {
    let filteredTasks;
    
    if (category === 'all') {
        filteredTasks = appState.tasks;
    } else {
        filteredTasks = appState.tasks.filter(t => t.category === category);
    }
    
    renderTasks(filteredTasks);
}

// Render task list in the UI
function renderTasks(tasks = appState.tasks) {
    const taskList = document.getElementById('taskList');
    
    // Show empty state if no tasks
    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="empty-state" style="text-align: center; padding: 2rem;">No tasks yet! Add your first task to get started</p>';
        return;
    }
    
    // Build HTML for task list
    let taskHTML = '';
    for(let task of tasks) {
        taskHTML += `
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
        `;
    }
    
    taskList.innerHTML = taskHTML;
}

// Handle habit form submission
function handleHabitSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('habitName').value;
    const icon = document.getElementById('habitIcon').value;
    const target = parseInt(document.getElementById('habitTarget').value);
    
    // Create habit object
    const habit = {
        id: Date.now().toString(),
        name: name,
        icon: icon,
        target: target,
        streak: 0,
        completedDays: [],
        createdAt: new Date().toISOString()
    };
    
    // Add to habits array
    appState.habits.push(habit);
    saveAppState();
    updateUI();
    
    // Close modal and reset form
    hideModal('habitModal');
    document.getElementById('habitForm').reset();
    
    showNotification('New habit created! Lets build it together!', 'success');
}

// Toggle habit completion for current day
function toggleHabitDay(habitId) {
    const habit = appState.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    // Check if already completed today
    const today = new Date().toDateString();
    const dayIndex = habit.completedDays.indexOf(today);
    
    if (dayIndex === -1) {
        // Not completed yet today
        habit.completedDays.push(today);
        habit.streak++;
        
        // Award XP and credits for habit
        const xpGained = 15;
        const creditsGained = 3;
        
        // Update user stats
        appState.user.xp += xpGained;
        appState.user.totalXP += xpGained;
        appState.user.credits += creditsGained;
        
        // Record activity
        addRecentActivity(`Completed habit "${habit.name}" (+${xpGained} XP)`);
        showNotification(`Habit completed! Keep it up!`, 'success');
    } else {
        // Already completed, undo it
        habit.completedDays.splice(dayIndex, 1);
        habit.streak = Math.max(0, habit.streak - 1);
    }
    
    // Check if level up
    checkLevelUp();
    saveAppState();
    updateUI();
}

// Render habits in the UI
function renderHabits() {
    const habitGrid = document.getElementById('habitGrid');
    
    // Show empty state if no habits
    if (appState.habits.length === 0) {
        habitGrid.innerHTML = '<div class="clean-card content-spacing" style="text-align: center;"><p class="empty-state">No habits yet! Start building better routines today</p></div>';
        return;
    }
    
    // Build HTML for habits grid
    let habitsHTML = '';
    
    // Get today's date for checking completion
    const today = new Date().toDateString();
    
    for(let habit of appState.habits) {
        const completedToday = habit.completedDays.includes(today);
        const progress = (habit.streak / habit.target) * 100;
        
        habitsHTML += `
            <div class="clean-card habit-card">
                <div class="habit-header">
                    <div class="habit-icon">${habit.icon}</div>
                    <div class="habit-info">
                        <h3>${habit.name}</h3>
                        <div class="habit-streak">${habit.streak} day streak</div>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
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
    }
    
    habitGrid.innerHTML = habitsHTML;
}

// Populate rewards store
function populateRewardsStore() {
    const rewardsGrid = document.getElementById('rewardsGrid');
    
    // Build HTML for rewards grid
    let rewardsHTML = '';
    
    // Add each reward card
    for(let reward of REWARDS_STORE) {
        rewardsHTML += `
            <div class="clean-card reward-card" onclick="redeemReward('${reward.id}')">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-title">${reward.name}</div>
                <div class="reward-cost">${reward.cost} credits</div>
            </div>
        `;
    }
    
    rewardsGrid.innerHTML = rewardsHTML;
}

// Redeem a reward
function redeemReward(rewardId) {
    // Find the reward by ID
    const reward = REWARDS_STORE.find(r => r.id === rewardId);
    if (!reward) return;
    
    // Check if user has enough credits
    if (appState.user.credits < reward.cost) {
        showNotification('Need more credits! Complete tasks to earn them', 'error');
        return;
    }
    
    // Subtract credits and record activity
    appState.user.credits -= reward.cost;
    addRecentActivity(`Redeemed "${reward.name}" (-${reward.cost} credits)`);
    
    saveAppState();
    updateUI();
    
    showNotification(`Reward claimed! Enjoy your ${reward.name}!`, 'success');
}

// Check if user leveled up
function checkLevelUp() {
    const newLevel = calculateLevel(appState.user.totalXP);
    
    // If new level is higher, level up!
    if (newLevel > appState.user.level) {
        // Calculate remaining XP for this level
        appState.user.level = newLevel;
        appState.user.xp = appState.user.totalXP - getXPForLevel(newLevel);
        
        // Award bonus credits for level up
        const creditsReward = newLevel * 5;
        appState.user.credits += creditsReward;
        
        // Record activity
        addRecentActivity(`Level Up! Now Level ${newLevel} (+${creditsReward} credits)`);
        showNotification(`Level Up! You're now Level ${newLevel}!`, 'success');
    }
}

// Calculate level based on total XP
function calculateLevel(totalXP) {
    // Simple level formula: level = sqrt(XP/50) + 1
    return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

// Calculate XP required for a given level
function getXPForLevel(level) {
    return (level - 1) * (level - 1) * 50;
}

// Calculate XP required for next level
function getXPForNextLevel(level) {
    return level * level * 50;
}

// Update user streak
function updateStreak() {
    const today = new Date().toDateString();
    
    // Check if any tasks were completed today
    const todayTasks = appState.tasks.filter(task => {
        return task.completed && new Date(task.completedAt).toDateString() === today;
    });
    
    // If we completed tasks today, ensure streak is at least 1
    if (todayTasks.length > 0) {
        appState.user.streak = Math.max(appState.user.streak, 1);
    }
}

// Get display name for category
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

// Add activity to recent activity list
function addRecentActivity(activity) {
    // Add to beginning of array
    appState.recentActivity.unshift({
        text: activity,
        timestamp: Date.now()
    });
    
    // Keep only last 8 activities
    if (appState.recentActivity.length > 8) {
        appState.recentActivity = appState.recentActivity.slice(0, 8);
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(function() {
        document.body.removeChild(notification);
    }, 3000);
}

// Add sample data for first-time users
function addSampleData() {
    // Add example tasks
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
    
    // Add example habit
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
    
    // Set starting stats
    appState.user.xp = 20;
    appState.user.totalXP = 20;
    appState.user.credits = 10;
    appState.user.streak = 1;
    
    // Add welcome activities
    appState.recentActivity = [
        { text: 'Completed "Take a 15-minute walk" (+20 XP)', timestamp: Date.now() },
        { text: 'Welcome to ReConnect!', timestamp: Date.now() - 60000 }
    ];
    
    saveAppState();
}

// Update all UI elements
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
    
    // Update level progress bar
    const currentLevelXP = getXPForLevel(appState.user.level);
    const nextLevelXP = getXPForNextLevel(appState.user.level);
    const progress = ((appState.user.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    document.getElementById('levelProgress').style.width = `${Math.min(progress, 100)}%`;
    
    // Update recent activity list
    const recentActivityContainer = document.getElementById('recentActivity');
    
    if (appState.recentActivity && appState.recentActivity.length > 0) {
        // Build activity HTML
        let activityHTML = '';
        
        for(let activity of appState.recentActivity) {
            activityHTML += `
                <div class="activity-text" style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-light); font-size: var(--font-size-sm);">
                    ${activity.text}
                </div>
            `;
        }
        
        recentActivityContainer.innerHTML = activityHTML;
    }
    
    // Render components
    renderTasks();
    renderHabits();
}
