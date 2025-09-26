document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('sessions-list');
  const filterClass = document.getElementById('filter-class');
  const filterTeacher = document.getElementById('filter-teacher');
  const filterDate = document.getElementById('filter-date');

  function render(sessions) {
    if (!list) return;
    list.innerHTML = '';
    if (!sessions.length) {
      list.innerHTML = '<div class="empty">No sessions yet</div>';
      return;
    }
    sessions.forEach(s => {
      const card = document.createElement('div');
      card.className = 'session-card';
      card.innerHTML = `
        <div class="session-info">
          <h3>${s.subject || 'Session'}</h3>
          <div class="session-meta">
            <span>👨‍🏫 ${s.teacher_name || ''}</span>
            <span>🏷️ <span class="badge">${s.class_level || ''}</span></span>
            <span>📍 ${s.room || 'Online'}</span>
            <span>⏰ ${formatTime(s.start_time)} - ${formatTime(s.end_time)}</span>
            <span>🗓️ ${formatDate(s.date)}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn secondary" data-id="${s.id}">Details</button>
          <button class="btn primary" data-id="${s.id}">Join</button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  function formatDate(d) {
    try { return new Date(d).toLocaleDateString(); } catch { return d || ''; }
  }
  function formatTime(t) {
    if (!t) return '';
    // Expect HH:MM or full ISO; handle generically
    const date = new Date(`1970-01-01T${t.length <= 5 ? t+':00' : t}`);
    if (isNaN(date)) return t;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function waitAuth() {
    let tries = 0;
    while ((!window.auth || !window.auth.isInitialized()) && tries < 50) {
      await new Promise(r => setTimeout(r, 200));
      tries++;
    }
    if (!window.auth) throw new Error('Auth not initialized');
    return window.auth;
  }

  async function loadTeachers(supa) {
    const sel = filterTeacher;
    if (!sel) return;
    sel.innerHTML = '<option value="">All Teachers</option>';
    try {
      const { data, error } = await supa.from('teachers').select('id, full_name').order('full_name');
      if (error) throw error;
      (data || []).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.full_name || 'Teacher';
        sel.appendChild(opt);
      });
    } catch (e) {
      // silently ignore; keep default
    }
  }

  async function loadSessions() {
    try {
      const auth = await waitAuth();
      const supa = auth.supabase;
      await loadTeachers(supa);

      let query = supa.from('sessions').select('id, subject, class_level, date, start_time, end_time, room, teacher_id, teachers:teacher_id(full_name)');

      const cl = filterClass && filterClass.value;
      const th = filterTeacher && filterTeacher.value;
      const dt = filterDate && filterDate.value;
      if (cl) query = query.eq('class_level', cl);
      if (th) query = query.eq('teacher_id', th);
      if (dt) query = query.eq('date', dt);

      const { data, error } = await query.order('date', { ascending: true }).order('start_time', { ascending: true });
      if (error) throw error;

      const normalized = (data || []).map(row => ({
        id: row.id,
        subject: row.subject,
        class_level: row.class_level,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
        room: row.room,
        teacher_id: row.teacher_id,
        teacher_name: (row.teachers && row.teachers.full_name) || ''
      }));
      render(normalized);
    } catch (err) {
      if (list) list.innerHTML = '<div class="empty">Failed to load sessions</div>';
      console.error('Load sessions error:', err);
    }
  }

  [filterClass, filterTeacher, filterDate].forEach(el => {
    if (el) el.addEventListener('change', loadSessions);
  });

  loadSessions();
});


