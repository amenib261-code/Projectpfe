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
        loadCharts();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        renderCalendar(supabase);
        loadEvents();
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
            let { data: profile } = await supabase
                .from('profiles')
                .select('fullName')
                .eq('id', user.id)
                .single();
            const userName = profile && profile.fullName ? profile.fullName : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
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
    try {
        const { count: studentCount, error: studentError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });
        if (studentError) throw studentError;
        students = studentCount ?? 0;

        const { count: teacherCount, error: teacherError } = await supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true });
        if (teacherError) throw teacherError;
        teachers = teacherCount ?? 0;

        const { count: eventCount, error: eventError } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true });
        if (eventError) throw eventError;
        events = eventCount ?? 0;

        const { count: invoiceCount, error: invoiceError } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true });
        if (invoiceError) throw invoiceError;
        invoices = invoiceCount ?? 0;
    } catch (e) {
        showMessage('Failed to load stats: ' + e.message, 'error');
    }

    document.getElementById('completed-courses').textContent = students;
    document.getElementById('overall-progress').textContent = teachers;
    document.getElementById('achievements').textContent = events;
    document.getElementById('active-days').textContent = invoices;
}

function loadCharts() {
    const ctx = document.getElementById('schoolPerformance');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [
                    { 
                        label: 'Students', 
                        data: [30, 50, 40, 70], 
                        borderColor: '#ff7b1a',
                        backgroundColor: 'rgba(255, 123, 26, 0.1)',
                        fill: false 
                    },
                    { 
                        label: 'Teachers', 
                        data: [10, 20, 15, 25], 
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: false 
                    }
                ]
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
                        borderColor: '#ff7b1a',
                        backgroundColor: 'rgba(255, 123, 26, 0.1)',
                        fill: false 
                    },
                    { 
                        label: 'Expenses', 
                        data: [1500, 1200, 2000, 2200, 1800, 2500], 
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: false 
                    }
                ]
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
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('id, title, start, end');
        if (error) throw error;
        return (sessions || []).map(session => ({
            id: session.id,
            title: session.title,
            start: session.start,
            end: session.end
        }));
    } catch (err) {
        showMessage('Could not load sessions from the database.', 'error');
        return [];
    }
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
        }
    });
    calendar.render();
}

async function loadEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    const events = [
        {
            date: 'Jan 15',
            title: 'Python Workshop',
            description: 'Interactive workshop to learn Python basics'
        },
        {
            date: 'Jan 20',
            title: 'Coding Competition',
            description: 'Monthly contest for solving programming problems'
        },
        {
            date: 'Jan 25',
            title: 'Excel Lecture',
            description: 'Free lecture on advanced Excel'
        }
    ];
    eventsList.innerHTML = events.map(event => `
        <div class="event-item">
            <div class="event-date">${event.date}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-description">${event.description}</div>
        </div>
    `).join('');
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
