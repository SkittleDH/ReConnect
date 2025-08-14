// Simple app data
var userData = {
    level: 1,
    xp: 0,
    totalXp: 0,
    credits: 0,
    streak: 0
};

var tasks = [];
var habits = [];
var activities = [];

// XP values
var xpValues = {
    easy: {min: 10, max: 25},
    medium: {min: 25, max: 50},
    hard: {min: 50, max: 100}
};

// Rewards list
var rewards = [
    {name: "Coffee Break", cost: 5, icon: "☕"},
    {name: "Movie Night", cost: 20, icon: "🎬"},
    {name: "New Book", cost: 30, icon: "📚"},
    {name: "Gaming Time", cost: 15, icon: "🎮"}
];

// Initialize app
window.onload = function() {
    loadData();
    updateStats();
    showTab('dashboard');
    displayTasks();
    displayHabits();
    displayRewards();
    
    // Add event listeners
    document.getElementById('task-form').addEventListener('submit', addTask);
    document.getElementById('habit-form').addEventListener('submit', addHabit);
    
    // Add sample data if first time
    if (tasks.length === 0 && habits.length === 0) {
        addSampleData();
    }
};

// Save data
function saveData() {
    localStorage.setItem('reconnect-data', JSON.stringify({
        userData: userData,
        tasks: tasks,
        habits: habits,
        activities: activities
    }));
}

// Load data
function loadData() {
    var data = localStorage.getItem('reconnect-data');
    if (data) {
        var parsed = JSON.parse(data);
        userData = parsed.userData || userData;
        tasks = parsed.tasks || tasks;
        habits = parsed.habits || habits;
        activities = parsed.activities || activities;
    }
}

// Show tab content
function showTab(tabName) {
    // Hide all tabs
    var tabs = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.add('hidden');
    }
    
    // Show selected tab
    document.getElementById(tabName).classList.remove('hidden');
    
    // Update nav buttons
    var buttons = document.getElementsByClassName('nav-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
        if (buttons[i].innerText.toLowerCase() === tabName || 
            (buttons[i].innerText === 'Home' && tabName === 'dashboard')) {
            buttons[i].classList.add('active');
        }
    }
}

// Update user stats
function updateStats() {
    document.getElementById('user-level').innerText = userData.level;
    document.getElementById('user-xp').innerText = userData.xp;
    document.getElementById('next-level-xp').innerText = getNextLevelXp();
    document.getElementById('today-xp').innerText = userData.xp;
    document.getElementById('tasks-done').innerText = countCompletedTasks();
    document.getElementById('streak').innerText = userData.streak;
    document.getElementById('credits').innerText = userData.credits;
    document.getElementById('reward-credits').innerText = userData.credits;
    
    // Update progress bar
    var percentage = (userData.xp / getNextLevelXp()) * 100;
    document.getElementById('level-progress').style.width = percentage + '%';
    
    // Update activities
    displayActivities();
}

function getNextLevelXp() {
    return userData.level * 100;
}

function countCompletedTasks() {
    var count = 0;
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].completed) {
            count++;
        }
    }
    return count;
}

// Task functions
function openTaskForm() {
    document.getElementById('task-form-popup').classList.remove('hidden');
}

function closeTaskForm() {
    document.getElementById('task-form-popup').classList.add('hidden');
    document.getElementById('task-form').reset();
}

function addTask(e) {
    e.preventDefault();
    
    var title = document.getElementById('task-input').value;
    var category = document.getElementById('task-category').value;
    var difficulty = document.getElementById('task-difficulty').value;
    
    var xp = calculateXp(difficulty);
    
    var task = {
        id: new Date().getTime(),
        title: title,
        category: category,
        difficulty: difficulty,
        xp: xp,
        completed: false,
        date: new Date()
    };
    
    tasks.push(task);
    saveData();
    displayTasks();
    closeTaskForm();
    
    alert('Task added!');
}

function calculateXp(difficulty) {
    var range = xpValues[difficulty];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function displayTasks() {
    var taskList = document.getElementById('task-list');
    var html = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p>No tasks yet. Add your first task!</p>';
        return;
    }
    
    for (var i = 0; i < tasks.length; i++) {
        html += `
            <div class="task-item">
                <div class="checkbox ${tasks[i].completed ? 'checked' : ''}" onclick="completeTask(${tasks[i].id})"></div>
                <div>
                    <div>${tasks[i].title}</div>
                    <div>${tasks[i].category} - ${tasks[i].difficulty}</div>
                </div>
                <div>+${tasks[i].xp} XP</div>
                <button onclick="deleteTask(${tasks[i].id})">Delete</button>
            </div>
        `;
    }
    
    taskList.innerHTML = html;
}

function completeTask(id) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id && !tasks[i].completed) {
            tasks[i].completed = true;
            
            // Give XP and credits
            userData.xp += tasks[i].xp;
            userData.totalXp += tasks[i].xp;
            userData.credits += Math.floor(tasks[i].xp / 5);
            
            // Add to activities
            addActivity('Completed task: ' + tasks[i].title + ' (+' + tasks[i].xp + ' XP)');
            
            // Check for level up
            checkLevelUp();
            
            saveData();
            displayTasks();
            updateStats();
            
            alert('Task completed! +' + tasks[i].xp + ' XP');
            return;
        }
    }
}

function deleteTask(id) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
            tasks.splice(i, 1);
            saveData();
            displayTasks();
            return;
        }
    }
}

function filterTasks(category) {
    // Update active button
    var buttons = document.getElementsByClassName('filter');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
        if (buttons[i].innerText.toLowerCase() === category) {
            buttons[i].classList.add('active');
        }
    }
    
    var taskList = document.getElementById('task-list');
    var html = '';
    
    var filteredTasks = category === 'all' ? 
        tasks : 
        tasks.filter(function(task) { return task.category === category; });
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p>No tasks in this category.</p>';
        return;
    }
    
    for (var i = 0; i < filteredTasks.length; i++) {
        html += `
            <div class="task-item">
                <div class="checkbox ${filteredTasks[i].completed ? 'checked' : ''}" onclick="completeTask(${filteredTasks[i].id})"></div>
                <div>
                    <div>${filteredTasks[i].title}</div>
                    <div>${filteredTasks[i].category} - ${filteredTasks[i].difficulty}</div>
                </div>
                <div>+${filteredTasks[i].xp} XP</div>
                <button onclick="deleteTask(${filteredTasks[i].id})">Delete</button>
            </div>
        `;
    }
    
    taskList.innerHTML = html;
}

// Habit functions
function openHabitForm() {
    document.getElementById('habit-form-popup').classList.remove('hidden');
}

function closeHabitForm() {
    document.getElementById('habit-form-popup').classList.add('hidden');
    document.getElementById('habit-form').reset();
}

function addHabit(e) {
    e.preventDefault();
    
    var title = document.getElementById('habit-input').value;
    var icon = document.getElementById('habit-icon').value;
    var goal = document.getElementById('habit-goal').value;
    
    var habit = {
        id: new Date().getTime(),
        title: title,
        icon: icon,
        goal: parseInt(goal),
        streak: 0,
        completed: [],
        date: new Date()
    };
    
    habits.push(habit);
    saveData();
    displayHabits();
    closeHabitForm();
    
    alert('Habit added!');
}

function displayHabits() {
    var habitList = document.getElementById('habit-list');
    var html = '';
    
    if (habits.length === 0) {
        habitList.innerHTML = '<p>No habits yet. Start building good habits!</p>';
        return;
    }
    
    for (var i = 0; i < habits.length; i++) {
        var todayStr = new Date().toDateString();
        var completedToday = habits[i].completed.includes(todayStr);
        
        html += `
            <div class="habit-item">
                <div>${habits[i].icon}</div>
                <div>
                    <div>${habits[i].title}</div>
                    <div>Streak: ${habits[i].streak} days</div>
                    <div>Goal: ${habits[i].streak}/${habits[i].goal} days</div>
                </div>
                <button onclick="completeHabit(${habits[i].id})">${completedToday ? 'Completed Today' : 'Mark Complete'}</button>
            </div>
        `;
    }
    
    habitList.innerHTML = html;
}

function completeHabit(id) {
    var today = new Date().toDateString();
    
    for (var i = 0; i < habits.length; i++) {
        if (habits[i].id === id) {
            if (habits[i].completed.includes(today)) {
                // Already completed today, uncomplete it
                habits[i].completed.splice(habits[i].completed.indexOf(today), 1);
                habits[i].streak--;
            } else {
                // Complete for today
                habits[i].completed.push(today);
                habits[i].streak++;
                
                // Give XP and credits
                var xp = 15;
                userData.xp += xp;
                userData.totalXp += xp;
                userData.credits += 3;
                
                // Add to activities
                addActivity('Completed habit: ' + habits[i].title + ' (+' + xp + ' XP)');
                
                // Check for level up
                checkLevelUp();
                
                alert('Habit completed! +' + xp + ' XP');
            }
            
            saveData();
            displayHabits();
            updateStats();
            return;
        }
    }
}

// Reward functions
function displayRewards() {
    var rewardsList = document.getElementById('rewards-list');
    var html = '';
    
    for (var i = 0; i < rewards.length; i++) {
        html += `
            <div class="reward-item">
                <div>
                    <span>${rewards[i].icon}</span>
                    <span>${rewards[i].name}</span>
                </div>
                <div>
                    <span>${rewards[i].cost} credits</span>
                    <button onclick="redeemReward(${i})">Redeem</button>
                </div>
            </div>
        `;
    }
    
    rewardsList.innerHTML = html;
}

function redeemReward(index) {
    var reward = rewards[index];
    
    if (userData.credits >= reward.cost) {
        userData.credits -= reward.cost;
        
        // Add to activities
        addActivity('Redeemed reward: ' + reward.name + ' (-' + reward.cost + ' credits)');
        
        saveData();
        updateStats();
        
        alert('Reward claimed: ' + reward.name + '!');
    } else {
        alert('Not enough credits! You need ' + (reward.cost - userData.credits) + ' more.');
    }
}

// Activity functions
function addActivity(text) {
    activities.unshift({
        text: text,
        date: new Date()
    });
    
    // Keep only the last 10 activities
    if (activities.length > 10) {
        activities.pop();
    }
}

function displayActivities() {
    var activityList = document.getElementById('activity-list');
    var html = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p>Complete tasks to see activity here!</p>';
        return;
    }
    
    for (var i = 0; i < activities.length; i++) {
        html += `<p>${activities[i].text}</p>`;
    }
    
    activityList.innerHTML = html;
}

// Level functions
function checkLevelUp() {
    var nextLevel = Math.floor(userData.totalXp / 100) + 1;
    
    if (nextLevel > userData.level) {
        var levelsGained = nextLevel - userData.level;
        userData.level = nextLevel;
        
        // Add bonus credits
        var bonusCredits = levelsGained * 5;
        userData.credits += bonusCredits;
        
        // Add to activities
        addActivity('Level up! You are now level ' + userData.level + ' (+' + bonusCredits + ' credits)');
        
        alert('Level up! You are now level ' + userData.level + '!');
    }
}

// Add sample data
function addSampleData() {
    tasks.push({
        id: 1,
        title: 'Go for a walk',
        category: 'health',
        difficulty: 'easy',
        xp: 20,
        completed: false,
        date: new Date()
    });
    
    habits.push({
        id: 1,
        title: 'Drink water',
        icon: '💧',
        goal: 7,
        streak: 0,
        completed: [],
        date: new Date()
    });
    
    activities.push({
        text: 'Welcome to ReConnect!',
        date: new Date()
    });
    
    saveData();
    displayTasks();
    displayHabits();
    displayActivities();
}
