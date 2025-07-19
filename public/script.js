// script.js

// Initialize Lucide icons
lucide.createIcons();

// --- Global State ---
const appState = {
    theme: 'light',
    dailyEmissions: {}, // { 'YYYY-MM-DD': { total: N, categories: {...} } }
    currentPage: 'home',
    currentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    modalCallback: null // For custom confirmation modal
};

// --- Emission Factors & Constants ---
const EMISSION_FACTORS = {
    transport: {
        'Car (Petrol)': 0.165, // kg CO2/km
        'Car (Diesel)': 0.150, // kg CO2/km
        'Bus': 0.050, // kg CO2/km
        'Train': 0.020, // kg CO2/km
        'Metro': 0.005, // kg CO2/km
        'Flight (Short-haul)': 0.230, // kg CO2/km (e.g., < 1000km)
        'Flight (Long-haul)': 0.120, // kg CO2/km (e.g., > 1000km)
        'Walking': 0,
        'Bicycle': 0,
    },
    electricity: {
        'Global Average': 0.475, // kg CO2/kWh
        'India': 0.71, // kg CO2/kWh
        'USA': 0.39, // kg CO2/kWh
        'EU': 0.275, // kg CO2/kWh
    },
    food: {
        'Vegan': 1.0, // kg CO2e/day
        'Vegetarian': 2.0, // kg CO2e/day
        'Mixed (1-2 non-veg meals)': 3.5, // kg CO2e/day
        'Fully Non-Veg': 6.0, // kg CO2e/day
    },
    purchases: {
        'Electronics': 0.5, // kg CO2e/$
        'Clothes': 0.3, // kg CO2e/$
        'Appliances': 0.7, // kg CO2e/$
        'General Goods': 0.2, // kg CO2e/$ (fallback)
    },
    homeHeatingCooling: {
        'AC/Heater': 1.065, // kg CO2e/hour (assuming 1.5kW * 0.71 kg/kWh for India)
    },
};

const DAILY_AVERAGES = {
    global: 13, // kg CO2/day
    india: 6.6, // kg CO2/day
    sustainable: 2.5, // kg CO2/day
};

// --- Utility Functions ---

/**
 * Shows a custom confirmation modal.
 * @param {string} message The message to display.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled.
 */
function showConfirmationModal(message) {
    return new Promise((resolve) => {
        const modalOverlay = document.getElementById('confirmation-modal');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        modalMessage.textContent = message;
        modalOverlay.classList.remove('hidden');

        // Apply dark mode class to modal content if theme is dark
        const modalContent = modalOverlay.querySelector('.modal-content');
        if (appState.theme === 'dark') {
            modalContent.classList.add('dark');
        } else {
            modalContent.classList.remove('dark');
        }

        const handleConfirm = () => {
            modalOverlay.classList.add('hidden');
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            modalOverlay.classList.add('hidden');
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            resolve(false);
        };

        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
    });
}

/**
 * Loads state from localStorage.
 */
function loadState() {
    const savedTheme = localStorage.getItem('carbonTrackerTheme');
    if (savedTheme) {
        appState.theme = savedTheme;
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        document.documentElement.classList.toggle('light', savedTheme === 'light');
    } else {
        document.documentElement.classList.add('light'); // Default to light
    }

    const savedEmissions = localStorage.getItem('carbonTrackerEmissions');
    if (savedEmissions) {
        appState.dailyEmissions = JSON.parse(savedEmissions);
    }
    console.log("Data loaded from localStorage:", appState.dailyEmissions);
}

/**
 * Saves state to localStorage.
 */
function saveState() {
    localStorage.setItem('carbonTrackerTheme', appState.theme);
    localStorage.setItem('carbonTrackerEmissions', JSON.stringify(appState.dailyEmissions));
    console.log("Data saved to localStorage.");
}

/**
 * Toggles between light and dark themes.
 */
function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', appState.theme === 'dark');
    document.documentElement.classList.toggle('light', appState.theme === 'light');
    updateThemeIcon();
    saveState(); // Save theme preference
}

/**
 * Updates the theme icon in the sidebar.
 */
function updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', appState.theme === 'light' ? 'moon' : 'sun');
        themeText.textContent = appState.theme === 'light' ? 'Dark Mode' : 'Light Mode';
        lucide.createIcons(); // Re-render Lucide icon
    }
}

/**
 * Adds an emission entry for a given date and category, saving to localStorage.
 * @param {string} date YYYY-MM-DD
 * @param {string} category
 * @param {number} value
 */
function addEmissionEntry(date, category, value) {
    const dayData = appState.dailyEmissions[date] || { total: 0, categories: {} };
    const updatedCategories = {
        ...dayData.categories,
        [category]: (dayData.categories[category] || 0) + value,
    };
    const newTotal = Object.values(updatedCategories).reduce((sum, val) => sum + val, 0);

    appState.dailyEmissions = {
        ...appState.dailyEmissions,
        [date]: {
            total: newTotal,
            categories: updatedCategories,
        },
    };
    saveState(); // Save to localStorage after each update
}

/**
 * Gets emissions data for a specific date.
 * @param {string} date YYYY-MM-DD
 * @returns {object} { total: N, categories: {...} }
 */
function getEmissionsForDate(date) {
    return appState.dailyEmissions[date] || { total: 0, categories: {} };
}

/**
 * Gets emission data formatted for charts (last X days).
 * @param {number} days
 * @returns {Array<object>}
 */
function getEmissionsDataForCharts(days = 30) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const emissions = appState.dailyEmissions[dateString] || { total: 0, categories: {} };
        data.push({
            date: dateString,
            total: emissions.total,
            ...emissions.categories,
        });
    }
    return data;
}

/**
 * Calculates the total emissions for the last 7 days.
 * @returns {number}
 */
function getWeeklyTotal() {
    let total = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        total += (appState.dailyEmissions[dateString]?.total || 0);
    }
    return total;
}

/**
 * Calculates badge progress.
 * @returns {object} { badges: { lowEmissionStreak: boolean, weeklyLogger: boolean }, lowEmissionDays: number, consecutiveLowEmissionDays: number }
 */
function getBadgeProgress() {
    let lowEmissionDays = 0;
    let consecutiveLowEmissionDays = 0;
    let lastDayLow = false;

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const emissions = appState.dailyEmissions[dateString]?.total || 0;

        if (emissions > 0 && emissions < DAILY_AVERAGES.india) { // Assuming Indian average as low emission target for badge
            lowEmissionDays++;
            if (lastDayLow || i === 0) { // If it's the current day or previous was low
                consecutiveLowEmissionDays++;
            }
            lastDayLow = true;
        } else {
            lastDayLow = false;
            consecutiveLowEmissionDays = 0; // Reset consecutive count if a day is not low
        }
    }

    const badges = {
        lowEmissionStreak: consecutiveLowEmissionDays >= 3,
        weeklyLogger: lowEmissionDays >= 5, // Logged low emissions for 5 out of 7 days
    };

    return { badges, lowEmissionDays, consecutiveLowEmissionDays };
}

/**
 * Updates the active state of sidebar buttons.
 */
function updateSidebarActiveState() {
    document.querySelectorAll('#sidebar button').forEach(button => {
        const page = button.id.replace('nav-', '');
        if (page === appState.currentPage) {
            button.classList.add('bg-green-200', 'dark:bg-green-700', 'text-green-800', 'dark:text-green-100', 'font-semibold', 'shadow-md');
            button.classList.remove('hover:bg-gray-200', 'dark:hover:bg-gray-700');
        } else {
            button.classList.remove('bg-green-200', 'dark:bg-green-700', 'text-green-800', 'dark:text-green-100', 'font-semibold', 'shadow-md');
            button.classList.add('hover:bg-gray-200', 'dark:hover:bg-gray-700');
        }
    });
}

/**
 * Toggles sidebar visibility on small screens.
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    } else {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    }
}

/**
 * Renders the current page content.
 */
function renderPage() {
    const mainContent = document.getElementById('main-content');
    // Preserve the sidebar toggle button if it exists
    const sidebarToggleButton = document.getElementById('sidebar-toggle-btn');
    mainContent.innerHTML = ''; // Clear previous content
    if (sidebarToggleButton) {
        mainContent.appendChild(sidebarToggleButton); // Re-add the button
    }

    switch (appState.currentPage) {
        case 'home':
            renderHomePage();
            break;
        case 'log':
            renderLogActivityPage();
            break;
        case 'history':
            renderHistoryPage();
            break;
        case 'compare':
            renderComparePage();
            break;
        case 'learn':
            renderLearnPage();
            break;
        case 'settings':
            renderSettingsPage();
            break;
        default:
            renderHomePage();
    }
    lucide.createIcons(); // Re-render Lucide icons for new content
    updateSidebarActiveState();
}

// --- Page Rendering Functions ---

function renderHomePage() {
    const mainContent = document.getElementById('main-content');
    const todayEmissions = getEmissionsForDate(appState.currentDate);
    const weeklyTotal = getWeeklyTotal();
    const { badges, lowEmissionDays, consecutiveLowEmissionDays } = getBadgeProgress();

    // Store the existing content to append after the toggle button
    const existingContent = mainContent.innerHTML;

    mainContent.innerHTML = `
        ${existingContent} <div class="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 class="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                Dashboard Overview
                <div class="flex items-center space-x-2 mt-4 sm:mt-0">
                    <button id="navigate-date-prev" class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                        <i data-lucide="chevron-left" class="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-200"></i>
                    </button>
                    <input type="date" id="current-date-input" value="${appState.currentDate}"
                        class="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                    />
                    <button id="navigate-date-next" class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                        <i data-lucide="chevron-right" class="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-200"></i>
                    </button>
                </div>
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div class="bg-gradient-to-tr from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 p-4 md:p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                    <i data-lucide="activity" class="w-8 h-8 md:w-12 md:h-12 text-green-700 dark:text-green-300 mb-2 md:mb-3"></i>
                    <p class="text-base md:text-lg text-green-800 dark:text-green-200">Today's Emissions (${appState.currentDate})</p>
                    <p class="text-3xl md:text-4xl font-bold text-green-900 dark:text-green-100 mt-1 md:mt-2">
                        ${todayEmissions.total.toFixed(2)} kg CO₂
                    </p>
                    <p class="text-xs md:text-sm text-green-700 dark:text-green-300 mt-1 md:mt-2">
                        Recommended: ${DAILY_AVERAGES.india} kg/day
                    </p>
                    ${todayEmissions.total > DAILY_AVERAGES.india ? `
                        <p class="text-red-600 dark:text-red-300 text-xs md:text-sm mt-1">
                            You are above the Indian daily average.
                        </p>` : todayEmissions.total <= DAILY_AVERAGES.india && todayEmissions.total > 0 ? `
                        <p class="text-blue-600 dark:text-blue-300 text-xs md:text-sm mt-1">
                            You are below the Indian daily average. Keep it up!
                        </p>` : `
                        <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm mt-1">
                            No data logged for today.
                        </p>`
                    }
                </div>

                <div class="bg-gradient-to-tr from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 p-4 md:p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                    <i data-lucide="calendar-days" class="w-8 h-8 md:w-12 md:h-12 text-blue-700 dark:text-blue-300 mb-2 md:mb-3"></i>
                    <p class="text-base md:text-lg text-blue-800 dark:text-blue-200">Weekly Total Emissions</p>
                    <p class="text-3xl md:text-4xl font-bold text-blue-900 dark:text-blue-100 mt-1 md:mt-2">
                        ${weeklyTotal.toFixed(2)} kg CO₂
                    </p>
                    <p class="text-xs md:text-sm text-blue-700 dark:text-blue-300 mt-1 md:mt-2">
                        Goal: &lt; ${(DAILY_AVERAGES.india * 7).toFixed(2)} kg/week
                    </p>
                    ${weeklyTotal > DAILY_AVERAGES.india * 7 ? `
                        <p class="text-red-600 dark:text-red-300 text-xs md:text-sm mt-1">
                            You are above the weekly target.
                        </p>` : weeklyTotal <= DAILY_AVERAGES.india * 7 && weeklyTotal > 0 ? `
                        <p class="text-blue-600 dark:text-blue-300 text-xs md:text-sm mt-1">
                            You are doing great this week!
                        </p>` : ''
                    }
                </div>

                <div class="bg-gradient-to-tr from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 p-4 md:p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                    <i data-lucide="award" class="w-8 h-8 md:w-12 md:h-12 text-purple-700 dark:text-purple-300 mb-2 md:mb-3"></i>
                    <p class="text-base md:text-lg text-purple-800 dark:text-purple-200">Badge Progress</p>
                    <div class="mt-2 md:mt-4 w-full">
                        <div class="flex items-center justify-between text-purple-800 dark:text-purple-200 text-xs md:text-sm mb-1">
                            <span>Low Emission Streak (3 days)</span>
                            <span>${consecutiveLowEmissionDays}/3</span>
                        </div>
                        <div class="w-full bg-purple-200 rounded-full h-2 dark:bg-purple-700">
                            <div class="bg-purple-600 h-2 rounded-full" style="width: ${Math.min((consecutiveLowEmissionDays / 3) * 100, 100)}%;"></div>
                        </div>
                        ${badges.lowEmissionStreak ? `
                            <p class="text-green-700 dark:text-green-300 text-xs md:text-sm mt-1 md:mt-2">
                                Awarded: Streak Saver!
                            </p>` : ''
                        }
                    </div>
                    <div class="mt-2 md:mt-4 w-full">
                        <div class="flex items-center justify-between text-purple-800 dark:text-purple-200 text-xs md:text-sm mb-1">
                            <span>Weekly Logger (5 low days)</span>
                            <span>${lowEmissionDays}/5</span>
                        </div>
                        <div class="w-full bg-purple-200 rounded-full h-2 dark:bg-purple-700">
                            <div class="bg-purple-600 h-2 rounded-full" style="width: ${Math.min((lowEmissionDays / 5) * 100, 100)}%;"></div>
                        </div>
                        ${badges.weeklyLogger ? `
                            <p class="text-green-700 dark:text-green-300 text-xs md:text-sm mt-1 md:mt-2">
                                Awarded: Eco Warrior!
                            </p>` : ''
                        }
                    </div>
                </div>
            </div>

            ${todayEmissions.total > 0 ? `
                <div class="bg-gradient-to-tr from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8">
                    <h3 class="text-lg md:text-2xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">
                        Today's Category Breakdown
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                        ${Object.entries(todayEmissions.categories).length > 0 ?
                            Object.entries(todayEmissions.categories).map(([category, value]) => `
                                <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 md:p-3 rounded-lg">
                                    <span class="text-sm md:text-base text-gray-700 dark:text-gray-200 font-medium">${category}:</span>
                                    <span class="text-sm md:text-base text-gray-900 dark:text-gray-100 font-semibold">${value.toFixed(2)} kg CO₂</span>
                                </div>
                            `).join('')
                        : `
                            <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">No category data for today.</p>
                        `}
                    </div>
                </div>` : ''
            }

            <div class="bg-gradient-to-tr from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 p-4 md:p-6 rounded-xl shadow-md">
                <h3 class="text-lg md:text-2xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">
                    Quick Tips to Reduce Your Footprint
                </h3>
                <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 md:space-y-2 text-sm md:text-base">
                    <li>Opt for public transport or cycling instead of cars.</li>
                    <li>Reduce meat consumption, especially red meat.</li>
                    <li>Turn off lights and unplug electronics when not in use.</li>
                    <li>Choose energy-efficient appliances.</li>
                    <li>Support local and sustainable businesses.</li>
                </ul>
            </div>
        </div>
    `;

    // Add event listeners for date navigation
    document.getElementById('current-date-input').addEventListener('change', (e) => {
        appState.currentDate = e.target.value;
        renderPage();
    });
    document.getElementById('navigate-date-prev').addEventListener('click', () => {
        const d = new Date(appState.currentDate);
        d.setDate(d.getDate() - 1);
        appState.currentDate = d.toISOString().split('T')[0];
        renderPage();
    });
    document.getElementById('navigate-date-next').addEventListener('click', () => {
        const d = new Date(appState.currentDate);
        d.setDate(d.getDate() + 1);
        appState.currentDate = d.toISOString().split('T')[0];
        renderPage();
    });
}

function renderLogActivityPage() {
    const mainContent = document.getElementById('main-content');
    let message = ''; // To display feedback messages

    // Helper function to generate options for a dropdown
    const generateOptions = (start, end, increment, unit) => {
        let optionsHtml = `<option value="">Select ${unit}</option>`;
        optionsHtml += `<option value="0">0 ${unit}</option>`; // Add a zero option
        for (let i = start; i <= end; i += increment) {
            optionsHtml += `<option value="${i}">${i} ${unit}</option>`;
        }
        return optionsHtml;
    };

    const InputCardHTML = (title, iconName, inputsHtml, logHandlerName) => `
        <div class="bg-gradient-to-tr from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 p-4 md:p-6 rounded-xl shadow-md flex flex-col">
            <div class="flex items-center mb-3 md:mb-4">
                <i data-lucide="${iconName}" class="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400 mr-2 md:mr-3"></i>
                <h3 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">${title}</h3>
            </div>
            <div class="flex-grow space-y-3 md:space-y-4">
                ${inputsHtml}
            </div>
            <button id="log-${logHandlerName}" class="mt-4 md:mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base">
                Log ${title}
            </button>
        </div>
    `;

    const existingContent = mainContent.innerHTML;

    mainContent.innerHTML = `
        ${existingContent} <div class="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 class="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-100">Log Your Daily Activity</h2>

            <div id="log-message" class="hidden bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100 p-3 rounded-lg mb-4 text-center text-sm md:text-base"></div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                ${InputCardHTML('Transport', 'car', `
                    <select id="transport-mode" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        <option value="">Select Mode</option>
                        ${Object.keys(EMISSION_FACTORS.transport).map(mode => `<option value="${mode}">${mode}</option>`).join('')}
                    </select>
                    <select id="transport-distance" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        ${generateOptions(1, 100, 1, 'km')}
                    </select>
                `, 'transport')}

                ${InputCardHTML('Electricity', 'zap', `
                    <select id="electricity-units" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        ${generateOptions(1, 100, 1, 'kWh')}
                    </select>
                    <select id="electricity-location" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        ${Object.keys(EMISSION_FACTORS.electricity).map(loc => `<option value="${loc}" ${loc === 'India' ? 'selected' : ''}>${loc}</option>`).join('')}
                    </select>
                `, 'electricity')}

                ${InputCardHTML('Food/Diet', 'utensils', `
                    <select id="food-diet" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        <option value="">Select Diet Type</option>
                        ${Object.keys(EMISSION_FACTORS.food).map(diet => `<option value="${diet}">${diet}</option>`).join('')}
                    </select>
                `, 'food')}

                ${InputCardHTML('Purchases', 'shopping-bag', `
                    <select id="purchase-category" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        <option value="">Select Category</option>
                        ${Object.keys(EMISSION_FACTORS.purchases).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                    <select id="purchase-cost" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        ${generateOptions(100, 50000, 100, 'currency units')} </select>
                `, 'purchase')}

                ${InputCardHTML('Home Heating/Cooling', 'thermometer', `
                    <select id="heating-cooling-duration" class="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base">
                        ${generateOptions(1, 24, 1, 'hours')}
                    </select>
                `, 'home-heating-cooling')}
            </div>

            <div id="log-result" class="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-tr from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 rounded-xl shadow-md text-center hidden"></div>
        </div>
    `;

    const showMessage = (msg, type = 'info') => {
        const msgDiv = document.getElementById('log-message');
        msgDiv.textContent = msg;
        msgDiv.classList.remove('hidden', 'bg-blue-100', 'dark:bg-blue-700', 'bg-red-100', 'dark:bg-red-700', 'text-blue-800', 'dark:text-blue-100', 'text-red-800', 'dark:text-red-100');
        msgDiv.classList.add(type === 'error' ? 'bg-red-100' : 'bg-blue-100');
        msgDiv.classList.add(type === 'error' ? 'dark:bg-red-700' : 'dark:bg-blue-700');
        msgDiv.classList.add(type === 'error' ? 'text-red-800' : 'text-blue-800');
        msgDiv.classList.add(type === 'error' ? 'dark:text-red-100' : 'dark:text-blue-100');
        setTimeout(() => msgDiv.classList.add('hidden'), 3000);
    };

    const displayResult = (category, emission) => {
        const resultDiv = document.getElementById('log-result');
        const todayTotal = getEmissionsForDate(appState.currentDate).total;
        resultDiv.innerHTML = `
            <h3 class="text-lg md:text-2xl font-bold text-green-800 dark:text-green-100 mb-2 md:mb-3">Activity Logged!</h3>
            <p class="text-base md:text-lg text-green-700 dark:text-green-200">
                You added <span class="font-semibold">${emission.toFixed(2)} kg CO₂</span> for <span class="font-semibold">${category}</span> today.
            </p>
            <p class="text-sm md:text-base text-green-600 dark:text-green-300 mt-1 md:mt-2">
                Your total for today is now
                <span class="font-bold">${todayTotal.toFixed(2)} kg CO₂</span>.
            </p>
            ${todayTotal > DAILY_AVERAGES.india ? `
                <p class="text-red-600 dark:text-red-300 text-xs md:text-sm mt-1">
                    This is above the recommended ${DAILY_AVERAGES.india} kg/day for India.
                </p>` : `
                <p class="text-blue-600 dark:text-blue-300 text-xs md:text-sm mt-1">
                    You are below or at the recommended ${DAILY_AVERAGES.india} kg/day for India. Great job!
                </p>`
            }
        `;
        resultDiv.classList.remove('hidden');
        setTimeout(() => resultDiv.classList.add('hidden'), 5000);
    };

    // Event Listeners for Log Activity - MUST be re-attached after innerHTML update
    document.getElementById('log-transport').addEventListener('click', () => {
        const mode = document.getElementById('transport-mode').value;
        const distance = parseFloat(document.getElementById('transport-distance').value);
        if (mode && !isNaN(distance) && distance >= 0) { // Check for >=0 as 0 is a valid option
            const emission = EMISSION_FACTORS.transport[mode] * distance;
            addEmissionEntry(appState.currentDate, 'Transport', emission);
            displayResult('Transport', emission);
            document.getElementById('transport-mode').value = '';
            document.getElementById('transport-distance').value = ''; // Reset dropdown
        } else {
            showMessage('Please select mode and a valid distance for Transport.', 'error');
        }
    });

    document.getElementById('log-electricity').addEventListener('click', () => {
        const units = parseFloat(document.getElementById('electricity-units').value);
        const location = document.getElementById('electricity-location').value;
        if (!isNaN(units) && units >= 0 && location) { // Check for >=0
            const emission = EMISSION_FACTORS.electricity[location] * units;
            addEmissionEntry(appState.currentDate, 'Electricity', emission);
            displayResult('Electricity', emission);
            document.getElementById('electricity-units').value = ''; // Reset dropdown
        } else {
            showMessage('Please enter valid units and select location for Electricity.', 'error');
        }
    });

    document.getElementById('log-food').addEventListener('click', () => {
        const diet = document.getElementById('food-diet').value;
        if (diet) {
            const emission = EMISSION_FACTORS.food[diet];
            addEmissionEntry(appState.currentDate, 'Food', emission);
            displayResult('Food/Diet', emission);
            document.getElementById('food-diet').value = '';
        } else {
            showMessage('Please select your diet for Food.', 'error');
        }
    });

    document.getElementById('log-purchase').addEventListener('click', () => {
        const category = document.getElementById('purchase-category').value;
        const cost = parseFloat(document.getElementById('purchase-cost').value);
        if (category && !isNaN(cost) && cost >= 0) { // Check for >=0
            const emission = EMISSION_FACTORS.purchases[category] * cost;
            addEmissionEntry(appState.currentDate, 'Purchases', emission);
            displayResult('Purchases', emission);
            document.getElementById('purchase-category').value = '';
            document.getElementById('purchase-cost').value = ''; // Reset dropdown
        } else {
            showMessage('Please select category and enter a valid cost for Purchases.', 'error');
        }
    });

    document.getElementById('log-home-heating-cooling').addEventListener('click', () => {
        const duration = parseFloat(document.getElementById('heating-cooling-duration').value);
        if (!isNaN(duration) && duration >= 0) { // Check for >=0
            const emission = EMISSION_FACTORS.homeHeatingCooling['AC/Heater'] * duration;
            addEmissionEntry(appState.currentDate, 'Home Heating/Cooling', emission);
            displayResult('Home Heating/Cooling', emission);
            document.getElementById('heating-cooling-duration').value = ''; // Reset dropdown
        } else {
            showMessage('Please enter a valid duration for Home Heating/Cooling.', 'error');
        }
    });
}

function renderHistoryPage() {
    const mainContent = document.getElementById('main-content');
    const chartData = getEmissionsDataForCharts(); // Last 30 days
    const latestDayData = appState.dailyEmissions[Object.keys(appState.dailyEmissions).pop()];
    const pieChartData = latestDayData ? Object.entries(latestDayData.categories).map(([name, value]) => ({ name, value })) : [];

    const existingContent = mainContent.innerHTML;

    mainContent.innerHTML = `
        ${existingContent} <div class="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 class="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-100">Your Emission History</h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md">
                    <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">Daily CO₂ Emissions (Last 30 Days)</h3>
                    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" class="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                    <th scope="col" class="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total CO₂ (kg)</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                ${chartData.map((day, index) => `
                                    <tr class="${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}">
                                        <td class="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${day.date}</td>
                                        <td class="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${day.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 md:mt-4">
                        (Note: For advanced charting, a dedicated JavaScript charting library would be integrated here.)
                    </p>
                </div>

                <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md">
                    <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">Emissions by Category (Last Logged Day)</h3>
                    ${pieChartData.length > 0 ? `
                        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" class="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                        <th scope="col" class="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">CO₂ (kg)</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    ${pieChartData.map((item, index) => `
                                        <tr class="${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}">
                                            <td class="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${item.name}</td>
                                            <td class="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${item.value.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">No category data available for the latest logged day to display.</p>
                        <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">Log some activity to see your breakdown!</p>
                    `}
                </div>
            </div>
        </div>
    `;
}


function renderComparePage() {
    const mainContent = document.getElementById('main-content');
    const todayEmissions = getEmissionsForDate(appState.currentDate);
    const userDailyAvg = Object.values(appState.dailyEmissions).reduce((sum, day) => sum + day.total, 0) / Object.keys(appState.dailyEmissions).length || 0;

    const comparisonData = [
        { name: 'Your Today', value: todayEmissions.total, color: '#60A5FA' }, // blue-400
        { name: 'Your Average', value: userDailyAvg, color: '#FBBF24' }, // amber-400
        { name: 'Indian Average', value: DAILY_AVERAGES.india, color: '#EF4444' }, // red-500
        { name: 'Global Average', value: DAILY_AVERAGES.global, color: '#8B5CF6' }, // purple-500
        { name: 'Sustainable Target', value: DAILY_AVERAGES.sustainable, color: '#10B981' }, // emerald-500
    ];

    const existingContent = mainContent.innerHTML;

    mainContent.innerHTML = `
        ${existingContent} <div class="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 class="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-100">Compare Your Footprint</h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md">
                    <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">Daily CO₂ Comparison (kg)</h3>
                    <div class="space-y-2 md:space-y-4">
                        ${comparisonData.map(item => `
                            <div class="flex items-center">
                                <span class="inline-block w-3 h-3 md:w-4 md:h-4 rounded-full mr-2 md:mr-3" style="background-color: ${item.color};"></span>
                                <span class="text-sm md:text-base text-gray-700 dark:text-gray-300 w-24 md:w-36">${item.name}:</span>
                                <span class="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">${item.value.toFixed(2)} kg CO₂</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 md:mt-4">
                        (Note: This section displays comparative data in a list format. For bar chart visualization, a dedicated JavaScript charting library would be integrated here.)
                    </p>
                </div>

                <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md">
                    <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">Your Standing</h3>
                    <div class="space-y-2 md:space-y-4 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                        <p>
                            Your logged emissions for today (${appState.currentDate}): <span class="font-bold text-gray-900 dark:text-gray-100">${todayEmissions.total.toFixed(2)} kg CO₂</span>
                        </p>
                        <p>
                            Your average daily emissions (all time): <span class="font-bold text-gray-900 dark:text-gray-100">${userDailyAvg.toFixed(2)} kg CO₂</span>
                        </p>
                        <hr class="border-gray-200 dark:border-gray-700" />
                        <p class="flex items-center">
                            <span class="inline-block w-3 h-3 md:w-4 md:h-4 rounded-full mr-2 bg-red-500"></span>
                            Indian National Average: <span class="font-bold ml-1">${DAILY_AVERAGES.india} kg CO₂/day</span>
                        </p>
                        <p class="flex items-center">
                            <span class="inline-block w-3 h-3 md:w-4 md:h-4 rounded-full mr-2 bg-purple-500"></span>
                            Global Average: <span class="font-bold ml-1">${DAILY_AVERAGES.global} kg CO₂/day</span>
                        </p>
                        <p class="flex items-center">
                            <span class="inline-block w-3 h-3 md:w-4 md:h-4 rounded-full mr-2 bg-green-500"></span>
                            Sustainable Target: <span class="font-bold ml-1">${DAILY_AVERAGES.sustainable} kg CO₂/day</span>
                        </p>

                        <div class="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-sm md:text-base">
                            ${todayEmissions.total > DAILY_AVERAGES.global ? `
                                <p>Your today's footprint is higher than the global average. There's room for improvement!</p>
                            ` : todayEmissions.total > DAILY_AVERAGES.india ? `
                                <p>Your today's footprint is higher than the Indian average. Consider reducing certain activities.</p>
                            ` : todayEmissions.total <= DAILY_AVERAGES.sustainable && todayEmissions.total > 0 ? `
                                <p>Excellent! Your today's footprint is at or below the sustainable target. Keep up the great work!</p>
                            ` : todayEmissions.total > 0 ? `
                                <p>Your today's footprint is below the Indian average. You're doing well, aim for the sustainable target!</p>
                            ` : `
                                <p>Log some activity to see how you compare!</p>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderLearnPage() {
    const mainContent = document.getElementById('main-content');
    const learningContent = [
        {
            title: "What is Carbon Footprint?",
            icon: "info",
            content: "Your carbon footprint is the total amount of greenhouse gases (including carbon dioxide and methane) that are generated by your actions. It's usually expressed as tons of carbon dioxide equivalent (CO₂e) emitted per year. Understanding your footprint is the first step towards reducing it."
        },
        {
            title: "How is Transport Calculated?",
            icon: "car",
            content: "Emissions from transport are calculated based on the distance traveled and the mode of transport. Different vehicles have different emission factors (e.g., cars emit more CO₂ per km than trains). Flights have higher factors due to altitude effects and fuel type."
        },
        {
            title: "Understanding Electricity Emissions",
            icon: "zap",
            content: "Electricity emissions depend on the energy mix of your region. If your electricity comes from coal-fired power plants, it will have a higher emission factor than if it comes from renewables like solar or wind. We use location-specific factors where available."
        },
        {
            title: "The Impact of Your Diet",
            icon: "utensils",
            content: "Food production, transportation, and consumption contribute significantly to your carbon footprint. Meat, especially red meat, has a much higher footprint than plant-based foods due to land use, methane emissions from livestock, and feed production. A vegan diet generally has the lowest footprint."
        },
        {
            title: "Purchases and Consumption",
            icon: "shopping-bag",
            content: "Every product we buy has a carbon footprint associated with its manufacturing, transport, and disposal. We estimate this by using average lifecycle emissions per dollar spent for different product categories. Choosing durable, locally sourced, and second-hand items can help reduce this."
        },
        {
            title: "Home Energy Use (Heating/Cooling)",
            icon: "thermometer",
            content: "Heating and cooling your home consumes a lot of energy, primarily electricity or fossil fuels. The duration and intensity of use, along with the efficiency of your appliances, directly impact your emissions. Insulating your home and using energy-efficient systems can make a big difference."
        },
        {
            title: "Actionable Tips to Reduce",
            icon: "activity",
            content: "Small changes add up! Consider walking or cycling for short distances, using public transport, reducing meat intake, unplugging unused electronics, using energy-efficient appliances, and buying less. Every effort counts!"
        },
    ];

    const existingContent = mainContent.innerHTML;

    mainContent.innerHTML = `
        ${existingContent} <div class="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 class="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-100">Learn About Your Carbon Footprint</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                ${learningContent.map(item => `
                    <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md flex flex-col">
                        <div class="flex items-center mb-3 md:mb-4">
                            <i data-lucide="${item.icon}" class="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400 mr-2 md:mr-3"></i>
                            <h3 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">${item.title}</h3>
                        </div>
                        <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 flex-grow">${item.content}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSettingsPage() {
    const mainContent = document.getElementById('main-content');

    const existingContent = mainContent.innerHTML;

    mainContent.innerHTML = `
        ${existingContent} <div class="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 class="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-100">Settings</h2>

            <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-4 md:mb-6">
                <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">Theme</h3>
                <div class="flex items-center justify-between">
                    <span class="text-sm md:text-base text-gray-700 dark:text-gray-300">Current Theme: <span class="font-semibold capitalize">${appState.theme}</span></span>
                    <button id="settings-theme-toggle" class="flex items-center p-2 md:p-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-800 dark:text-gray-100 text-sm md:text-base">
                        <i data-lucide="${appState.theme === 'light' ? 'moon' : 'sun'}" class="mr-2 w-4 h-4 md:w-5 md:h-5"></i>
                        Toggle Theme
                    </button>
                </div>
            </div>

            <div class="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 md:p-6 rounded-xl shadow-md">
                <h3 class="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">Data Management</h3>
                <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
                    Your data is currently stored locally in your browser. Clearing it will remove all your saved carbon footprint entries.
                </p>
                <button id="clear-data-button" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-2 md:mt-4 text-sm md:text-base">
                    Clear All Data
                </button>
            </div>
        </div>
    `;

    document.getElementById('settings-theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('clear-data-button').addEventListener('click', async () => {
        const confirmed = await showConfirmationModal('Are you sure you want to clear ALL your carbon footprint data from this browser? This action cannot be undone.');
        if (confirmed) {
            localStorage.removeItem('carbonTrackerEmissions');
            appState.dailyEmissions = {}; // Reset local state
            console.log("All data cleared from localStorage.");
            renderPage(); // Re-render current page to reflect empty data
        }
    });
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load data and theme from local storage
    loadState();

    // Set initial theme and render page
    updateThemeIcon();
    renderPage();

    // Add event listeners for sidebar navigation
    document.getElementById('nav-home').addEventListener('click', () => { appState.currentPage = 'home'; renderPage(); });
    document.getElementById('nav-log').addEventListener('click', () => { appState.currentPage = 'log'; renderPage(); });
    document.getElementById('nav-history').addEventListener('click', () => { appState.currentPage = 'history'; renderPage(); });
    document.getElementById('nav-compare').addEventListener('click', () => { appState.currentPage = 'compare'; renderPage(); });
    document.getElementById('nav-learn').addEventListener('click', () => { appState.currentPage = 'learn'; renderPage(); });
    document.getElementById('nav-settings').addEventListener('click', () => { appState.currentPage = 'settings'; renderPage(); });

    // Theme toggle in sidebar
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Sidebar toggle for mobile
    document.getElementById('sidebar-toggle-btn').addEventListener('click', toggleSidebar);

    // Close sidebar when a navigation item is clicked (for mobile)
    document.querySelectorAll('#sidebar button').forEach(button => {
        button.addEventListener('click', () => {
            // Only close if sidebar is currently open on mobile
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open') && window.innerWidth < 768) {
                toggleSidebar();
            }
        });
    });

    // Adjust sidebar visibility on window resize
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (window.innerWidth >= 768) { // md breakpoint
            sidebar.classList.remove('open'); // Ensure sidebar is not 'open' class
            backdrop.classList.remove('active'); // Hide backdrop
            sidebar.style.display = 'flex'; // Ensure it's flex on desktop
        } else {
            // On small screens, if it's not explicitly opened by user, keep it hidden by default
            // If it's not 'open' (meaning it's closed), ensure it's hidden.
            if (!sidebar.classList.contains('open')) {
                sidebar.style.display = 'none'; // Ensure it's hidden on mobile if not open
            }
        }
        // Re-render to ensure content layout adapts
        renderPage();
    });
});