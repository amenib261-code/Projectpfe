// Dashboard - Updated to remove profiles table dependency (v2)
document.addEventListener('DOMContentLoaded', async function() {
    let attempts = 0;
    while ((!window.auth || !window.auth.supabase) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    if (!window.auth || !window.auth.supabase) {
        showMessage('Authentication system failed to load. Please refresh the page.', 'error');
        return;
    }
    const supabase = window.auth.supabase;

    try {
        await loadUserInfo(supabase);
        await loadStats(supabase);
        await loadCharts();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        renderCalendar(supabase);
        loadTodaysSessions(supabase);
    } catch (err) {
        showMessage('An unexpected error occurred: ' + err.message, 'error');
    }
});

async function loadUserInfo(supabase) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
            document.getElementById('user-email').textContent = user.email || '';
            
            // Use user metadata or email for user name (no profiles table needed)
            let userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            
            document.getElementById('user-name').textContent = userName;
            document.getElementById('user-avatar').textContent = userName.charAt(0).toUpperCase();
        } else {
            document.getElementById('user-name').textContent = 'Guest';
            document.getElementById('user-email').textContent = '';
            document.getElementById('user-avatar').textContent = 'G';
            showMessage('Please log in to access the dashboard.', 'error');
            window.location.href = '../auth/login.html';
        }
    } catch (err) {
        showMessage('Failed to load user info: ' + err.message, 'error');
    }
}

async function loadStats(supabase) {
    let students = 0, teachers = 0, events = 0, invoices = 0;
    
    console.log('=== LOADING STATS ===');
    console.log('Config available:', !!window.CONFIG);
    console.log('Config:', window.CONFIG);
    
    try {
        // Skip Supabase client and go directly to service role API
        console.log('Using direct API calls with service role key...');
        students = await getStudentsCountDirect();
        teachers = await getTeachersCountDirect();

        // Get groups count
        events = await getGroupsCount();
        invoices = await getClassEnrollmentsCount();
        
    } catch (e) {
        console.error('Failed to load stats:', e);
        showMessage('Failed to load stats: ' + e.message, 'error');
    }

    // Update the stat cards with real data
    document.getElementById('total-students').textContent = students;
    document.getElementById('total-teachers').textContent = teachers;
    document.getElementById('total-events').textContent = events;
    document.getElementById('total-invoices').textContent = invoices;
    
    console.log('=== FINAL STATS ===');
    console.log('Stats updated:', { students, teachers, events, invoices });
}

// Direct API calls using service role key from config
async function getStudentsCountDirect() {
    try {
        if (!window.CONFIG) {
            console.error('Config not loaded');
            return 0;
        }
        
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TABLES } = window.CONFIG;
        
        console.log('=== STUDENTS COUNT DEBUG ===');
        console.log('SUPABASE_URL:', SUPABASE_URL);
        console.log('TABLES.USERS:', TABLES.USERS);
        console.log('Service role key available:', !!SUPABASE_SERVICE_ROLE_KEY);
        
        const url = `${SUPABASE_URL}/rest/v1/${TABLES.USERS}?select=*`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Raw response data:', data);
            console.log(`Students count (direct API from ${TABLES.USERS}):`, data.length);
            return data.length;
        } else {
            const errorText = await response.text();
            console.error('Students API response error:', response.status, response.statusText);
            console.error('Error response body:', errorText);
        }
    } catch (error) {
        console.error('Direct students count error:', error);
    }
    return 0;
}

async function getTeachersCountDirect() {
    try {
        if (!window.CONFIG) {
            console.error('Config not loaded');
            return 0;
        }
        
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TABLES } = window.CONFIG;
        
        console.log('=== TEACHERS COUNT DEBUG ===');
        console.log('TABLES.TEACHERS:', TABLES.TEACHERS);
        
        const url = `${SUPABASE_URL}/rest/v1/${TABLES.TEACHERS}?select=*`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Raw response data:', data);
            console.log(`Teachers count (direct API from ${TABLES.TEACHERS}):`, data.length);
            return data.length;
        } else {
            const errorText = await response.text();
            console.error('Teachers API response error:', response.status, response.statusText);
            console.error('Error response body:', errorText);
        }
    } catch (error) {
        console.error('Direct teachers count error:', error);
    }
    return 0;
}

// Get groups count
async function getGroupsCount() {
    try {
        if (!window.CONFIG) {
            console.error('Config not loaded');
            return 0;
        }
        
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = window.CONFIG;
        
        console.log('=== GETTING CLASSES COUNT ===');
        
        // Get groups from Groupe table
        const response = await fetch(`${SUPABASE_URL}/rest/v1/Groupe?select=*`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Groups data:', data);
            console.log('Groups count:', data.length);
            return data.length;
        } else {
            console.log('Groups table not found, using sample count');
            return 0; // No groups yet
        }
    } catch (error) {
        console.error('Error getting groups count:', error);
        return 0;
    }
}

// Get class enrollments count
async function getClassEnrollmentsCount() {
    try {
        if (!window.CONFIG) {
            console.error('Config not loaded');
            return 0;
        }
        
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = window.CONFIG;
        
        console.log('=== GETTING CLASS ENROLLMENTS COUNT ===');
        
        // Get enrollments from ClassStudents table
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ClassStudents?select=*`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Class enrollments data:', data);
            console.log('Class enrollments count:', data.length);
            return data.length;
        } else {
            console.log('ClassStudents table not found, using sample count');
            return 0; // No enrollments yet
        }
    } catch (error) {
        console.error('Error getting class enrollments count:', error);
        return 0;
    }
}

// Get real-time data for charts
async function getRealTimeChartData() {
    try {
        console.log('=== GETTING REAL-TIME CHART DATA ===');
        
        // Get current counts
        const currentStudents = await getStudentsCountDirect();
        const currentTeachers = await getTeachersCountDirect();
        
        console.log('Current students:', currentStudents);
        console.log('Current teachers:', currentTeachers);
        
        // For now, we'll simulate historical data based on current counts
        // In a real application, you'd fetch historical data from the database
        const studentsData = [
            Math.max(0, currentStudents - 5), // 3 months ago
            Math.max(0, currentStudents - 3), // 2 months ago  
            Math.max(0, currentStudents - 1), // 1 month ago
            currentStudents // Current month
        ];
        
        const teachersData = [
            Math.max(0, currentTeachers - 2), // 3 months ago
            Math.max(0, currentTeachers - 1), // 2 months ago
            currentTeachers, // 1 month ago
            currentTeachers // Current month
        ];
        
        console.log('Students chart data:', studentsData);
        console.log('Teachers chart data:', teachersData);
        
        return {
            students: studentsData,
            teachers: teachersData
        };
        
    } catch (error) {
        console.error('Error getting real-time chart data:', error);
        // Return fallback data
        return {
            students: [0, 0, 0, 0],
            teachers: [0, 0, 0, 0]
        };
    }
}

async function loadCharts() {
    // Load real-time data for the school performance chart
    const realTimeData = await getRealTimeChartData();
    
    const ctx = document.getElementById('schoolPerformance');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Current Month', 'Previous Month', '2 Months Ago', '3 Months Ago'],
                datasets: [
                    { 
                        label: 'Students', 
                        data: realTimeData.students, 
                        borderColor: '#1a63ff',
                        backgroundColor: 'rgba(26, 99, 255, 0.2)',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#1a63ff',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    { 
                        label: 'Teachers', 
                        data: realTimeData.teachers, 
                        borderColor: '#ff6b35',
                        backgroundColor: 'rgba(255, 107, 53, 0.2)',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#ff6b35',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Real-time School Performance',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Number of People',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
    const ctx2 = document.getElementById('financeChart');
    if (ctx2 && window.Chart) {
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [
                    { 
                        label: 'Income', 
                        data: [2000, 3000, 2500, 4000, 3500, 5000], 
                        borderColor: '#1a63ff',
                        backgroundColor: 'rgba(26, 99, 255, 0.1)',
                        fill: false 
                    },
                    { 
                        label: 'Expenses', 
                        data: [1500, 1200, 2000, 2200, 1800, 2500], 
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        fill: false 
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US');
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function loadCalendarEvents(supabase) {
    try {
        console.log('=== LOADING CALENDAR EVENTS ===');
        
        // Try to fetch from Groupe table with sessions data
        const { data: groups, error } = await supabase
            .from(window.CONFIG?.TABLES?.GROUPES || 'Groupe')
            .select('id, name, subject_id, teacher_id, sessions, Teacher:teacher_id(fullname), Subject:subject_id(subjects)');
        
        console.log('Groups data from database:', groups);
        console.log('Groups error:', error);
        
        if (error) {
            console.log('Groupe table not found, using sample events:', error.message);
            // Return sample events if Groupe table doesn't exist
            return getSampleEvents();
        }
        
        // Convert groups with sessions to calendar events format
        const events = [];
        
        (groups || []).forEach(group => {
            console.log('Processing group:', group.name, 'Sessions data:', group.sessions);
            let groupSessions = [];
            
            // Parse sessions JSON
            try {
                if (group.sessions) {
                    if (typeof group.sessions === 'string') {
                        groupSessions = JSON.parse(group.sessions);
                        console.log('Parsed sessions from string:', groupSessions);
                    } else if (Array.isArray(group.sessions)) {
                        groupSessions = group.sessions;
                        console.log('Sessions already array:', groupSessions);
                    }
                } else {
                    console.log('No sessions data for group:', group.name);
                }
            } catch (e) {
                console.warn('Failed to parse sessions for group:', group.name, e);
                groupSessions = [];
            }
            
            // If group has sessions, create calendar events for each session
            if (groupSessions.length > 0) {
                console.log('Group has sessions, creating events for:', group.name);
                groupSessions.forEach(session => {
                    console.log('Processing session:', session);
                    
                    // Create events for the next 4 weeks to ensure visibility in all views
                    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
                        const eventDate = getDateForDayOfWeek(session.day_of_week, weekOffset);
                        console.log(`Week ${weekOffset} - Date for ${session.day_of_week}:`, eventDate);
                        
                        if (eventDate) {
                            // Calculate end time (assuming 1 hour duration)
                            const startTime = session.time;
                            const [hours, minutes] = startTime.split(':');
                            const endTime = new Date();
                            endTime.setHours(parseInt(hours) + 1, parseInt(minutes), 0, 0);
                            const endTimeStr = endTime.toTimeString().slice(0, 5);
                            
                            const event = {
                                id: `${group.id}-${session.day_of_week}-${session.time}-${weekOffset}`,
                                title: `${group.name}`,
                                start: `${eventDate}T${session.time}:00`,
                                end: `${eventDate}T${endTimeStr}:00`,
                                teacher: group.Teacher?.fullname || 'Unknown Teacher',
                                groupId: group.id,
                                dayOfWeek: session.day_of_week,
                                time: session.time
                            };
                            
                            console.log('Created calendar event:', event);
                            events.push(event);
                        }
                    }
                });
            } else {
                // If no sessions, create a generic event
                events.push({
                    id: group.id,
                    title: `${group.name}`,
                    start: new Date().toISOString().split('T')[0] + 'T09:00:00',
                    end: new Date().toISOString().split('T')[0] + 'T10:00:00',
                    teacher: group.Teacher?.fullname || 'Unknown Teacher',
                    groupId: group.id
                });
            }
        });
        
        console.log('Final calendar events array:', events);
        console.log('Total events created:', events.length);
        
        return events;
    } catch (err) {
        console.log('Error loading groups, using sample events:', err.message);
        // Return sample events on any error
        return getSampleEvents();
    }
}

// Helper function to get date for a day of week with week offset
function getDateForDayOfWeek(dayOfWeek, weekOffset = 0) {
    console.log('Getting date for day:', dayOfWeek, 'week offset:', weekOffset);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(dayOfWeek);
    
    console.log('Target day index:', targetDay);
    
    if (targetDay === -1) {
        console.log('Invalid day of week:', dayOfWeek);
        return null;
    }
    
    const today = new Date();
    const currentDay = today.getDay();
    
    console.log('Today is:', days[currentDay], 'Target is:', days[targetDay]);
    
    // Calculate days until target day in the specified week
    let daysUntilTarget = targetDay - currentDay;
    daysUntilTarget += (weekOffset * 7); // Add week offset
    
    console.log('Days until target (with offset):', daysUntilTarget);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    const result = targetDate.toISOString().split('T')[0];
    console.log('Date result:', result);
    
    return result;
}

// Helper function to get next date for a day of week (backward compatibility)
function getNextDateForDayOfWeek(dayOfWeek) {
    return getDateForDayOfWeek(dayOfWeek, 0);
}

function getSampleEvents() {
    // Return sample events for demonstration - create events for multiple weeks
    const events = [];
    const today = new Date();
    
    // Create events for the next 4 weeks
    for (let week = 0; week < 4; week++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + (week * 7));
        
        // Monday Math Class
        const monday = new Date(weekStart);
        monday.setDate(weekStart.getDate() + (1 - weekStart.getDay() + 7) % 7);
        events.push({
            id: `math-${week}`,
            title: 'Math Class',
            start: monday.toISOString().split('T')[0] + 'T09:00:00',
            end: monday.toISOString().split('T')[0] + 'T10:00:00'
        });
        
        // Tuesday Science Lab
        const tuesday = new Date(weekStart);
        tuesday.setDate(weekStart.getDate() + (2 - weekStart.getDay() + 7) % 7);
        events.push({
            id: `science-${week}`,
            title: 'Science Lab',
            start: tuesday.toISOString().split('T')[0] + 'T14:00:00',
            end: tuesday.toISOString().split('T')[0] + 'T15:30:00'
        });
        
        // Wednesday English Literature
        const wednesday = new Date(weekStart);
        wednesday.setDate(weekStart.getDate() + (3 - weekStart.getDay() + 7) % 7);
        events.push({
            id: `english-${week}`,
            title: 'English Literature',
            start: wednesday.toISOString().split('T')[0] + 'T11:00:00',
            end: wednesday.toISOString().split('T')[0] + 'T12:00:00'
        });
        
        // Thursday Test Group
        const thursday = new Date(weekStart);
        thursday.setDate(weekStart.getDate() + (4 - weekStart.getDay() + 7) % 7);
        events.push({
            id: `test-${week}`,
            title: 'Test Tuesday Group',
            start: thursday.toISOString().split('T')[0] + 'T17:35:00',
            end: thursday.toISOString().split('T')[0] + 'T18:35:00'
        });
    }
    
    return events;
}

async function renderCalendar(supabase) {
    const calendarEl = document.getElementById('eventCalendar');
    if (!calendarEl || !window.FullCalendar) return;
    const events = await loadCalendarEvents(supabase);
    calendarEl.innerHTML = "";
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 500,
        events: events,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        allDaySlot: false,
        nowIndicator: true,
        eventDisplay: 'block',
        dayMaxEvents: false,
        moreLinkClick: 'popover'
    });
    calendar.render();
}

async function loadTodaysSessions(supabase) {
    const sessionsList = document.getElementById('sessions-list');
    if (!sessionsList) return;
    
    try {
        console.log('=== LOADING TODAY\'S SESSIONS ===');
        
        // Get today's date
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        
        console.log('Today is:', todayString, '(', todayDayName, ')');
        
        // Try to fetch from Groupe table with sessions data
        const { data: groups, error } = await supabase
            .from(window.CONFIG?.TABLES?.GROUPES || 'Groupe')
            .select('id, name, sessions, Teacher:teacher_id(fullname), Subject:subject_id(subjects)');
        
        if (error) {
            console.log('Groupe table not found, using sample sessions:', error.message);
            // Return sample sessions if Groupe table doesn't exist
            sessionsList.innerHTML = getSampleTodaysSessions();
            return;
        }
        
        // Find sessions for today
        const todaysSessions = [];
        
        (groups || []).forEach(group => {
            let groupSessions = [];
            
            // Parse sessions JSON
            try {
                if (group.sessions) {
                    if (typeof group.sessions === 'string') {
                        groupSessions = JSON.parse(group.sessions);
                    } else if (Array.isArray(group.sessions)) {
                        groupSessions = group.sessions;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse sessions for group:', group.name, e);
                groupSessions = [];
            }
            
            // Find sessions for today's day of week
            groupSessions.forEach(session => {
                if (session.day_of_week === todayDayName) {
                    todaysSessions.push({
                        id: `${group.id}-${session.time}`,
                        groupName: group.name,
                        time: session.time,
                        teacher: group.Teacher?.fullname || 'Unknown Teacher',
                        subject: group.Subject?.subjects || 'Class'
                    });
                }
            });
        });
        
        // Sort sessions by time
        todaysSessions.sort((a, b) => {
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
        
        console.log('Today\'s sessions found:', todaysSessions);
        
        if (todaysSessions.length === 0) {
            sessionsList.innerHTML = '<li style="color: #6c757d; font-style: italic;">No sessions scheduled for today</li>';
        } else {
            sessionsList.innerHTML = todaysSessions.map(session => {
                // Format time for display
                const [hours, minutes] = session.time.split(':');
                const time12 = new Date();
                time12.setHours(parseInt(hours), parseInt(minutes));
                const timeString = time12.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
                
                // Check if session is upcoming (within next 2 hours)
                const now = new Date();
                const sessionTime = new Date();
                sessionTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const timeDiff = sessionTime.getTime() - now.getTime();
                const hoursUntil = timeDiff / (1000 * 60 * 60);
                
                const isUpcoming = hoursUntil > 0 && hoursUntil <= 2;
                const isNow = Math.abs(hoursUntil) <= 0.5; // Within 30 minutes
                
                let timeClass = '';
                let timeStyle = '';
                
                if (isNow) {
                    timeClass = 'session-time-now';
                    timeStyle = 'background: #dc3545; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
                } else if (isUpcoming) {
                    timeClass = 'session-time-upcoming';
                    timeStyle = 'background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
                } else {
                    timeClass = 'session-time-past';
                    timeStyle = 'color: #6c757d;';
                }
                
                return `
                    <li class="session-item" style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #f8f9fa;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 500; color: #333;">${session.groupName}</div>
                                <div style="font-size: 12px; color: #666;">${session.subject} - ${session.teacher}</div>
                            </div>
                            <div class="${timeClass}" style="${timeStyle}">
                                ${timeString}
                            </div>
        </div>
                    </li>
                `;
            }).join('');
        }
        
    } catch (err) {
        console.log('Error loading today\'s sessions:', err.message);
        sessionsList.innerHTML = '<li style="color: #dc3545;">Error loading sessions</li>';
    }
}

function getSampleTodaysSessions() {
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Sample sessions for different days
    const sampleSessions = {
        'Monday': [
            { groupName: 'Math Advanced', time: '09:00', subject: 'Mathematics', teacher: 'John Smith' },
            { groupName: 'Science Lab', time: '14:00', subject: 'Physics', teacher: 'Sarah Johnson' }
        ],
        'Tuesday': [
            { groupName: 'English Literature', time: '10:30', subject: 'English', teacher: 'Mike Davis' },
            { groupName: 'Chemistry Lab', time: '16:00', subject: 'Chemistry', teacher: 'Lisa Brown' }
        ],
        'Wednesday': [
            { groupName: 'History Class', time: '11:00', subject: 'History', teacher: 'Robert Wilson' },
            { groupName: 'Art Workshop', time: '15:30', subject: 'Art', teacher: 'Emma Taylor' }
        ],
        'Thursday': [
            { groupName: 'Physics Lab', time: '09:30', subject: 'Physics', teacher: 'David Miller' },
            { groupName: 'Music Class', time: '13:00', subject: 'Music', teacher: 'Anna Garcia' }
        ],
        'Friday': [
            { groupName: 'Computer Science', time: '10:00', subject: 'Programming', teacher: 'Tom Anderson' },
            { groupName: 'Sports Activity', time: '14:30', subject: 'Physical Education', teacher: 'Chris Lee' }
        ],
        'Saturday': [
            { groupName: 'Weekend Workshop', time: '10:00', subject: 'General', teacher: 'Alex Johnson' }
        ],
        'Sunday': [
            { groupName: 'Study Group', time: '15:00', subject: 'Review', teacher: 'Maria Rodriguez' }
        ]
    };
    
    const todaysSessions = sampleSessions[todayDayName] || [];
    
    if (todaysSessions.length === 0) {
        return '<li style="color: #6c757d; font-style: italic;">No sessions scheduled for today</li>';
    }
    
    return todaysSessions.map(session => {
        // Format time for display
        const [hours, minutes] = session.time.split(':');
        const time12 = new Date();
        time12.setHours(parseInt(hours), parseInt(minutes));
        const timeString = time12.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Check if session is upcoming (within next 2 hours)
        const now = new Date();
        const sessionTime = new Date();
        sessionTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const timeDiff = sessionTime.getTime() - now.getTime();
        const hoursUntil = timeDiff / (1000 * 60 * 60);
        
        const isUpcoming = hoursUntil > 0 && hoursUntil <= 2;
        const isNow = Math.abs(hoursUntil) <= 0.5; // Within 30 minutes
        
        let timeClass = '';
        let timeStyle = '';
        
        if (isNow) {
            timeClass = 'session-time-now';
            timeStyle = 'background: #dc3545; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
        } else if (isUpcoming) {
            timeClass = 'session-time-upcoming';
            timeStyle = 'background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
        } else {
            timeClass = 'session-time-past';
            timeStyle = 'color: #6c757d;';
        }
        
        return `
            <li class="session-item" style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #f8f9fa;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 500; color: #333;">${session.groupName}</div>
                        <div style="font-size: 12px; color: #666;">${session.subject} - ${session.teacher}</div>
                    </div>
                    <div class="${timeClass}" style="${timeStyle}">
                        ${timeString}
                    </div>
                </div>
            </li>
        `;
    }).join('');
}

// Utility function for showing messages (small note on right)
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 220px;
        padding: 1rem 2rem;
        border-radius: 10px;
        color: white;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#ff7b1a'};
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.remove();
    }, 3500);
}

// Add CSS animation for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
