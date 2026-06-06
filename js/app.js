/**
 * To-Do Life Dashboard
 * A personal productivity dashboard with time display, Pomodoro timer,
 * task management, and quick links.
 */

(function() {
    'use strict';

    // ========================================
    // Storage Service Module
    // ========================================
    const StorageService = {
        // Check if localStorage is available (can fail in private browsing)
        isAvailable: (function() {
            try {
                const testKey = '__storage_test__';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                console.warn('LocalStorage is not available. Data will not persist across sessions.');
                return false;
            }
        })(),

        // In-memory fallback storage for when localStorage is unavailable
        _memoryStorage: {},

        /**
         * Get a value from storage
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if key doesn't exist or parsing fails
         * @returns {*} The stored value or default value
         */
        get(key, defaultValue) {
            try {
                let value;
                
                if (this.isAvailable) {
                    value = localStorage.getItem(key);
                } else {
                    value = this._memoryStorage[key];
                }

                if (value === null || value === undefined) {
                    return defaultValue;
                }

                // Try to parse as JSON, return raw value if parsing fails
                try {
                    return JSON.parse(value);
                } catch (parseError) {
                    console.error(`Failed to parse stored data for key "${key}":`, parseError);
                    return defaultValue;
                }
            } catch (error) {
                console.error(`Error reading from storage for key "${key}":`, error);
                return defaultValue;
            }
        },

        /**
         * Set a value in storage
         * @param {string} key - Storage key
         * @param {*} value - Value to store (will be JSON serialized)
         * @returns {boolean} True if successful, false otherwise
         */
        set(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                
                if (this.isAvailable) {
                    try {
                        localStorage.setItem(key, serializedValue);
                    } catch (e) {
                        if (e.name === 'QuotaExceededError') {
                            console.error('Storage quota exceeded. Please clear some data.');
                            // Attempt to notify user (could be enhanced with UI notification)
                            return false;
                        }
                        throw e;
                    }
                } else {
                    this._memoryStorage[key] = serializedValue;
                }
                
                return true;
            } catch (error) {
                console.error(`Error writing to storage for key "${key}":`, error);
                return false;
            }
        },

        /**
         * Remove a value from storage
         * @param {string} key - Storage key to remove
         * @returns {boolean} True if successful, false otherwise
         */
        remove(key) {
            try {
                if (this.isAvailable) {
                    localStorage.removeItem(key);
                } else {
                    delete this._memoryStorage[key];
                }
                return true;
            } catch (error) {
                console.error(`Error removing key "${key}" from storage:`, error);
                return false;
            }
        },

        /**
         * Clear all values from storage
         * @returns {boolean} True if successful, false otherwise
         */
        clear() {
            try {
                if (this.isAvailable) {
                    localStorage.clear();
                } else {
                    this._memoryStorage = {};
                }
                return true;
            } catch (error) {
                console.error('Error clearing storage:', error);
                return false;
            }
        }
    };

    // ========================================
    // Time Display Module
    // ========================================
    const TimeDisplay = {
        // DOM elements
        $timeDisplay: null,
        $dateDisplay: null,
        
        // Interval ID for clock updates
        intervalId: null,

        /**
         * Initialize the Time Display Module
         */
        init() {
            this.$timeDisplay = document.getElementById('timeDisplay');
            this.$dateDisplay = document.getElementById('dateDisplay');
            
            if (!this.$timeDisplay || !this.$dateDisplay) {
                console.error('Time display elements not found in DOM');
                return;
            }
            
            // Initial update
            this.updateDisplay();
            
            // Start clock updates every second
            this.startClock();
        },

        /**
         * Format time in 12-hour format with AM/PM
         * @param {Date} date - Date object to format
         * @returns {string} Formatted time string (HH:MM:SS AM/PM)
         */
        formatTime(date) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        },

        /**
         * Format date with day of week, month name, and day number
         * @param {Date} date - Date object to format
         * @returns {string} Formatted date string (DayName, MonthName Day)
         */
        formatDate(date) {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });
        },

        /**
         * Update the DOM with current time and date
         */
        updateDisplay() {
            const now = new Date();
            
            if (this.$timeDisplay) {
                this.$timeDisplay.textContent = this.formatTime(now);
            }
            
            if (this.$dateDisplay) {
                this.$dateDisplay.textContent = this.formatDate(now);
            }
        },

        /**
         * Start the clock interval to update display every second
         */
        startClock() {
            // Clear any existing interval to prevent duplicates
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
            }
            
            // Update every second (1000 milliseconds)
            this.intervalId = setInterval(() => {
                this.updateDisplay();
            }, 1000);
        },

        /**
         * Stop the clock interval (for cleanup)
         */
        stopClock() {
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
    };

    // ========================================
    // Greeting Module
    // ========================================
    const GreetingModule = {
        // DOM elements
        $greeting: null,
        
        // Current user name
        userName: null,
        
        // Last hour checked (to avoid unnecessary updates)
        lastHour: null,

        /**
         * Initialize the Greeting Module
         */
        init() {
            this.$greeting = document.getElementById('greeting');
            
            if (!this.$greeting) {
                console.error('Greeting element not found in DOM');
                return;
            }
            
            // Load user name from storage
            this.userName = StorageService.get('userName', null);
            
            // Initial display
            this.updateGreeting();
            
            // Update greeting every minute to check for hour changes
            setInterval(() => {
                this.updateGreeting();
            }, 60000); // Check every minute
            
            // Listen for user name changes from Settings Panel
            document.addEventListener('userName:changed', (event) => {
                this.userName = event.detail.userName;
                this.updateGreeting();
            });
        },

        /**
         * Get appropriate greeting based on hour (0-23)
         * @param {number} hour - Current hour (0-23)
         * @returns {string} Greeting message
         */
        getGreeting(hour) {
            if (hour >= 5 && hour < 12) {
                return "Good Morning";
            } else if (hour >= 12 && hour < 17) {
                return "Good Afternoon";
            } else if (hour >= 17 && hour < 21) {
                return "Good Evening";
            } else {
                return "Good Night";
            }
        },

        /**
         * Get full greeting message with optional user name
         * @param {number} hour - Current hour (0-23)
         * @param {string|null} userName - User's name (optional)
         * @returns {string} Complete greeting message
         */
        getGreetingMessage(hour, userName) {
            const greeting = this.getGreeting(hour);
            return userName ? `${greeting}, ${userName}` : greeting;
        },

        /**
         * Update the greeting display
         */
        updateGreeting() {
            const now = new Date();
            const currentHour = now.getHours();
            
            // Only update if hour has changed (optimization)
            if (this.lastHour !== currentHour) {
                this.lastHour = currentHour;
                
                if (this.$greeting) {
                    this.$greeting.textContent = this.getGreetingMessage(currentHour, this.userName);
                }
            }
        }
    };

    // ========================================
    // Focus Timer Module
    // ========================================
    const FocusTimer = {
        // DOM elements
        $timerDisplay: null,
        $startBtn: null,
        $stopBtn: null,
        $resetBtn: null,
        
        // Timer state
        duration: 1500, // Default 25 minutes in seconds
        remaining: 1500,
        isRunning: false,
        intervalId: null,

        /**
         * Initialize the Focus Timer Module
         */
        init() {
            this.$timerDisplay = document.getElementById('timerDisplay');
            this.$startBtn = document.getElementById('timerStart');
            this.$stopBtn = document.getElementById('timerStop');
            this.$resetBtn = document.getElementById('timerReset');
            
            if (!this.$timerDisplay || !this.$startBtn || !this.$stopBtn || !this.$resetBtn) {
                console.error('Timer elements not found in DOM');
                return;
            }
            
            // Load custom duration from storage (stored in minutes, convert to seconds)
            const savedDuration = StorageService.get('timerDuration', 25);
            this.duration = savedDuration * 60;
            this.remaining = this.duration;
            
            // Initial display
            this.updateDisplay();
            
            // Bind event listeners
            this.$startBtn.addEventListener('click', () => this.start());
            this.$stopBtn.addEventListener('click', () => this.stop());
            this.$resetBtn.addEventListener('click', () => this.reset());
            
            // Listen for duration changes from Settings Panel
            document.addEventListener('timerDuration:changed', (event) => {
                const newDuration = event.detail.duration * 60; // Convert minutes to seconds
                this.duration = newDuration;
                
                // If timer is not running, update remaining time
                if (!this.isRunning) {
                    this.remaining = this.duration;
                    this.updateDisplay();
                }
            });
        },

        /**
         * Format seconds to MM:SS format
         * @param {number} seconds - Total seconds
         * @returns {string} Formatted time string (MM:SS)
         */
        formatTime(seconds) {
            // Ensure non-negative
            const totalSeconds = Math.max(0, Math.floor(seconds));
            
            const minutes = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            
            return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        },

        /**
         * Update the timer display
         */
        updateDisplay() {
            if (this.$timerDisplay) {
                this.$timerDisplay.textContent = this.formatTime(this.remaining);
            }
        },

        /**
         * Start the countdown timer
         */
        start() {
            // Don't start if already running or if time is at zero
            if (this.isRunning || this.remaining <= 0) {
                return;
            }
            
            this.isRunning = true;
            
            // Update every second
            this.intervalId = setInterval(() => {
                this.tick();
            }, 1000);
        },

        /**
         * Stop/pause the countdown timer
         */
        stop() {
            if (!this.isRunning) {
                return;
            }
            
            this.isRunning = false;
            
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },

        /**
         * Reset timer to initial duration
         */
        reset() {
            this.stop();
            this.remaining = this.duration;
            this.updateDisplay();
        },

        /**
         * Decrement timer by one second
         */
        tick() {
            if (this.remaining > 0) {
                this.remaining--;
                this.updateDisplay();
                
                // Stop automatically when reaching zero
                if (this.remaining === 0) {
                    this.stop();
                    
                    // Announce to screen readers
                    const announcement = document.createElement('div');
                    announcement.setAttribute('role', 'status');
                    announcement.setAttribute('aria-live', 'polite');
                    announcement.textContent = 'Timer completed';
                    announcement.className = 'visually-hidden';
                    document.body.appendChild(announcement);
                    
                    // Remove announcement after a brief delay
                    setTimeout(() => {
                        document.body.removeChild(announcement);
                    }, 1000);
                }
            }
        }
    };

    // ========================================
    // Task Manager Module
    // ========================================
    const TaskManager = {
        // DOM elements
        $taskInput: null,
        $taskAddBtn: null,
        $taskList: null,
        
        // Task state
        tasks: [],
        editingTaskId: null,

        /**
         * Initialize the Task Manager Module
         */
        init() {
            this.$taskInput = document.getElementById('taskInput');
            this.$taskAddBtn = document.getElementById('taskAddBtn');
            this.$taskList = document.getElementById('taskList');
            
            if (!this.$taskInput || !this.$taskAddBtn || !this.$taskList) {
                console.error('Task manager elements not found in DOM');
                return;
            }
            
            // Load tasks from storage
            this.loadFromStorage();
            
            // Bind event listeners
            this.$taskAddBtn.addEventListener('click', () => this.handleAddTask());
            this.$taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddTask();
                }
            });
            
            // Initial render
            this.renderTasks();
        },

        /**
         * Generate a simple UUID v4
         * @returns {string} UUID
         */
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        /**
         * Validate task text
         * @param {string} text - Task text to validate
         * @returns {boolean} True if valid, false otherwise
         */
        validateTaskText(text) {
            const trimmed = text.trim();
            return trimmed.length > 0 && trimmed.length <= 500;
        },

        /**
         * Handle adding a new task
         */
        handleAddTask() {
            const text = this.$taskInput.value;
            
            if (!this.validateTaskText(text)) {
                // Show brief validation message
                this.$taskInput.focus();
                return;
            }
            
            this.addTask(text.trim());
            this.$taskInput.value = '';
            this.$taskInput.focus();
        },

        /**
         * Add a new task
         * @param {string} text - Task text
         */
        addTask(text) {
            const task = {
                id: this.generateUUID(),
                text: text,
                completed: false,
                createdAt: Date.now()
            };
            
            this.tasks.push(task);
            this.saveToStorage();
            this.renderTasks();
            
            // Announce to screen readers
            this.announceToScreenReader('Task added');
        },

        /**
         * Update an existing task
         * @param {string} id - Task ID
         * @param {Object} updates - Properties to update
         */
        updateTask(id, updates) {
            const taskIndex = this.tasks.findIndex(task => task.id === id);
            
            if (taskIndex !== -1) {
                // Preserve id, completed, and createdAt when updating text
                this.tasks[taskIndex] = {
                    ...this.tasks[taskIndex],
                    ...updates
                };
                
                this.saveToStorage();
                this.renderTasks();
            }
        },

        /**
         * Delete a task
         * @param {string} id - Task ID
         */
        deleteTask(id) {
            const taskIndex = this.tasks.findIndex(task => task.id === id);
            
            if (taskIndex !== -1) {
                this.tasks.splice(taskIndex, 1);
                this.saveToStorage();
                this.renderTasks();
                
                // Announce to screen readers
                this.announceToScreenReader('Task deleted');
            }
        },

        /**
         * Toggle task completion status
         * @param {string} id - Task ID
         */
        toggleComplete(id) {
            const task = this.tasks.find(task => task.id === id);
            
            if (task) {
                task.completed = !task.completed;
                this.saveToStorage();
                this.renderTasks();
            }
        },

        /**
         * Render all tasks to the DOM
         */
        renderTasks() {
            if (!this.$taskList) return;
            
            // Clear existing list
            this.$taskList.innerHTML = '';
            
            // Render each task
            this.tasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.$taskList.appendChild(taskElement);
            });
        },

        /**
         * Create a task DOM element
         * @param {Object} task - Task object
         * @returns {HTMLElement} Task list item element
         */
        createTaskElement(task) {
            const li = document.createElement('li');
            li.className = `task-item${task.completed ? ' task-item--completed' : ''}`;
            
            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-item__checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleComplete(task.id));
            
            // Task text
            const textSpan = document.createElement('span');
            textSpan.className = 'task-item__text';
            textSpan.textContent = task.text;
            
            // Enable editing on double-click
            textSpan.addEventListener('dblclick', () => this.enableEditMode(task.id, textSpan));
            
            // Actions container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-item__actions';
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-edit';
            editBtn.textContent = 'Edit';
            editBtn.setAttribute('aria-label', 'Edit task');
            editBtn.addEventListener('click', () => this.enableEditMode(task.id, textSpan));
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.setAttribute('aria-label', 'Delete task');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    this.deleteTask(task.id);
                }
            });
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(checkbox);
            li.appendChild(textSpan);
            li.appendChild(actionsDiv);
            
            return li;
        },

        /**
         * Enable edit mode for a task
         * @param {string} taskId - Task ID
         * @param {HTMLElement} textElement - Text span element
         */
        enableEditMode(taskId, textElement) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            this.editingTaskId = taskId;
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-field';
            input.value = task.text;
            input.maxLength = 500;
            
            // Save on Enter or blur
            const saveEdit = () => {
                const newText = input.value.trim();
                
                if (this.validateTaskText(newText)) {
                    this.updateTask(taskId, { text: newText });
                } else {
                    // Restore original text if invalid
                    this.renderTasks();
                }
                
                this.editingTaskId = null;
            };
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            });
            
            input.addEventListener('blur', saveEdit);
            
            // Replace text with input
            textElement.replaceWith(input);
            input.focus();
            input.select();
        },

        /**
         * Load tasks from storage
         */
        loadFromStorage() {
            this.tasks = StorageService.get('tasks', []);
        },

        /**
         * Save tasks to storage
         */
        saveToStorage() {
            StorageService.set('tasks', this.tasks);
        },

        /**
         * Announce message to screen readers
         * @param {string} message - Message to announce
         */
        announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.textContent = message;
            announcement.className = 'visually-hidden';
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        }
    };

    // ========================================
    // Quick Links Module
    // ========================================
    const QuickLinks = {
        // DOM elements
        $linkName: null,
        $linkUrl: null,
        $linkAddBtn: null,
        $linksList: null,
        
        // Links state
        links: [],

        /**
         * Initialize the Quick Links Module
         */
        init() {
            this.$linkName = document.getElementById('linkName');
            this.$linkUrl = document.getElementById('linkUrl');
            this.$linkAddBtn = document.getElementById('linkAddBtn');
            this.$linksList = document.getElementById('linksList');
            
            if (!this.$linkName || !this.$linkUrl || !this.$linkAddBtn || !this.$linksList) {
                console.error('Quick Links elements not found in DOM');
                return;
            }
            
            // Load links from storage
            this.loadFromStorage();
            
            // Bind event listeners
            this.$linkAddBtn.addEventListener('click', () => this.handleAddLink());
            
            // Allow Enter key to add link from either input
            this.$linkName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddLink();
                }
            });
            
            this.$linkUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddLink();
                }
            });
            
            // Initial render
            this.renderLinks();
        },

        /**
         * Generate a simple UUID v4
         * @returns {string} UUID
         */
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        /**
         * Validate link data
         * @param {string} name - Link name
         * @param {string} url - Link URL
         * @returns {boolean} True if valid, false otherwise
         */
        validateLink(name, url) {
            const trimmedName = name.trim();
            const trimmedUrl = url.trim();
            
            return trimmedName.length > 0 && 
                   trimmedName.length <= 50 && 
                   trimmedUrl.length > 0 && 
                   trimmedUrl.length <= 2000;
        },

        /**
         * Normalize URL by adding https:// if no protocol present
         * @param {string} url - URL to normalize
         * @returns {string} Normalized URL
         */
        normalizeUrl(url) {
            const trimmed = url.trim();
            
            // Check if URL already has http:// or https://
            if (!/^https?:\/\//i.test(trimmed)) {
                return `https://${trimmed}`;
            }
            
            return trimmed;
        },

        /**
         * Handle adding a new link
         */
        handleAddLink() {
            const name = this.$linkName.value;
            const url = this.$linkUrl.value;
            
            if (!this.validateLink(name, url)) {
                // Show brief validation message
                this.$linkName.focus();
                return;
            }
            
            this.addLink(name.trim(), url.trim());
            this.$linkName.value = '';
            this.$linkUrl.value = '';
            this.$linkName.focus();
        },

        /**
         * Add a new link
         * @param {string} name - Link name
         * @param {string} url - Link URL
         */
        addLink(name, url) {
            const link = {
                id: this.generateUUID(),
                name: name,
                url: this.normalizeUrl(url)
            };
            
            this.links.push(link);
            this.saveToStorage();
            this.renderLinks();
        },

        /**
         * Delete a link
         * @param {string} id - Link ID
         */
        deleteLink(id) {
            const linkIndex = this.links.findIndex(link => link.id === id);
            
            if (linkIndex !== -1) {
                this.links.splice(linkIndex, 1);
                this.saveToStorage();
                this.renderLinks();
            }
        },

        /**
         * Open a link in a new tab
         * @param {string} url - URL to open
         */
        openLink(url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        },

        /**
         * Render all links to the DOM
         */
        renderLinks() {
            if (!this.$linksList) return;
            
            // Clear existing list
            this.$linksList.innerHTML = '';
            
            // Render each link
            this.links.forEach(link => {
                const linkElement = this.createLinkElement(link);
                this.$linksList.appendChild(linkElement);
            });
        },

        /**
         * Create a link DOM element
         * @param {Object} link - Link object
         * @returns {HTMLElement} Link container element
         */
        createLinkElement(link) {
            const container = document.createElement('div');
            container.className = 'link-item';
            
            // Link button
            const linkBtn = document.createElement('button');
            linkBtn.className = 'link-item__btn';
            linkBtn.textContent = link.name;
            linkBtn.setAttribute('aria-label', `Open ${link.name}`);
            linkBtn.addEventListener('click', () => this.openLink(link.url));
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.setAttribute('aria-label', `Delete ${link.name}`);
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete the link "${link.name}"?`)) {
                    this.deleteLink(link.id);
                }
            });
            
            container.appendChild(linkBtn);
            container.appendChild(deleteBtn);
            
            return container;
        },

        /**
         * Load links from storage
         */
        loadFromStorage() {
            this.links = StorageService.get('quickLinks', []);
        },

        /**
         * Save links to storage
         */
        saveToStorage() {
            StorageService.set('quickLinks', this.links);
        }
    };

    // ========================================
    // Settings Panel Module
    // ========================================
    const SettingsPanel = {
        // DOM elements
        $userNameInput: null,
        $timerDurationInput: null,

        /**
         * Initialize the Settings Panel Module
         */
        init() {
            this.$userNameInput = document.getElementById('userNameInput');
            this.$timerDurationInput = document.getElementById('timerDurationInput');
            
            if (!this.$userNameInput || !this.$timerDurationInput) {
                console.error('Settings panel elements not found in DOM');
                return;
            }
            
            // Load saved values
            const savedUserName = StorageService.get('userName', null);
            const savedDuration = StorageService.get('timerDuration', 25);
            
            if (savedUserName) {
                this.$userNameInput.value = savedUserName;
            }
            
            this.$timerDurationInput.value = savedDuration;
            
            // Bind event listeners - save on blur and Enter key
            this.$userNameInput.addEventListener('blur', () => this.saveUserName());
            this.$userNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveUserName();
                    this.$userNameInput.blur();
                }
            });
            
            this.$timerDurationInput.addEventListener('blur', () => this.saveTimerDuration());
            this.$timerDurationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveTimerDuration();
                    this.$timerDurationInput.blur();
                }
            });
        },

        /**
         * Validate user name
         * @param {string} name - User name to validate
         * @returns {boolean} True if valid, false otherwise
         */
        validateUserName(name) {
            const trimmed = name.trim();
            return trimmed.length >= 0 && trimmed.length <= 50;
        },

        /**
         * Validate timer duration
         * @param {number} duration - Duration in minutes
         * @returns {boolean} True if valid, false otherwise
         */
        validateTimerDuration(duration) {
            const num = parseInt(duration, 10);
            return !isNaN(num) && num >= 1 && num <= 120;
        },

        /**
         * Save user name to storage and notify modules
         */
        saveUserName() {
            const name = this.$userNameInput.value;
            
            if (!this.validateUserName(name)) {
                // Reset to saved value if invalid
                const savedName = StorageService.get('userName', null);
                this.$userNameInput.value = savedName || '';
                return;
            }
            
            const trimmedName = name.trim();
            
            // Save to storage (allow empty string to clear name)
            if (trimmedName.length > 0) {
                StorageService.set('userName', trimmedName);
            } else {
                StorageService.remove('userName');
            }
            
            // Dispatch custom event to notify Greeting Module
            const event = new CustomEvent('userName:changed', {
                detail: { userName: trimmedName || null }
            });
            document.dispatchEvent(event);
        },

        /**
         * Save timer duration to storage and notify modules
         */
        saveTimerDuration() {
            const duration = this.$timerDurationInput.value;
            
            if (!this.validateTimerDuration(duration)) {
                // Reset to saved value if invalid
                const savedDuration = StorageService.get('timerDuration', 25);
                this.$timerDurationInput.value = savedDuration;
                return;
            }
            
            const durationNum = parseInt(duration, 10);
            
            // Save to storage
            StorageService.set('timerDuration', durationNum);
            
            // Dispatch custom event to notify Focus Timer
            const event = new CustomEvent('timerDuration:changed', {
                detail: { duration: durationNum }
            });
            document.dispatchEvent(event);
        }
    };

    // ========================================
    // Theme Switcher Module
    // ========================================
    const ThemeSwitcher = {
        // Current theme
        currentTheme: 'light',

        /**
         * Initialize the Theme Switcher Module
         */
        init() {
            const $themeToggle = document.getElementById('themeToggle');
            
            if (!$themeToggle) {
                console.error('Theme toggle button not found in DOM');
                return;
            }
            
            // Load saved theme or default to light
            this.loadTheme();
            
            // Bind event listener
            $themeToggle.addEventListener('click', () => this.toggleTheme());
        },

        /**
         * Load theme from storage and apply it
         */
        loadTheme() {
            const savedTheme = StorageService.get('theme', 'light');
            this.currentTheme = savedTheme;
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            this.updateToggleUI();
        },

        /**
         * Toggle between light and dark themes
         */
        toggleTheme() {
            // Switch to opposite theme
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            
            // Apply theme
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            
            // Save to storage
            StorageService.set('theme', this.currentTheme);
            
            // Update UI
            this.updateToggleUI();
        },

        /**
         * Update toggle UI state and accessibility attributes
         */
        updateToggleUI() {
            const $themeToggle = document.getElementById('themeToggle');
            const $themeLabelText = document.getElementById('themeLabelText');
            
            if ($themeToggle) {
                const isDark = this.currentTheme === 'dark';
                $themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            }
            
            if ($themeLabelText) {
                $themeLabelText.textContent = this.currentTheme === 'light' ? 'Light Mode' : 'Dark Mode';
            }
        }
    };

    // ========================================
    // Initialization
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('To-Do Life Dashboard loaded successfully');
        
        // Initialize modules in correct order:
        // 1. Theme Switcher - load and apply theme first
        ThemeSwitcher.init();
        
        // 2. Time Display - start clock
        TimeDisplay.init();
        
        // 3. Greeting Module - display greeting
        GreetingModule.init();
        
        // 4. Focus Timer - set up timer
        FocusTimer.init();
        
        // 5. Task Manager - load and render tasks
        TaskManager.init();
        
        // 6. Quick Links - load and render links
        QuickLinks.init();
        
        // 7. Settings Panel - set up event listeners
        SettingsPanel.init();
    });

})();
