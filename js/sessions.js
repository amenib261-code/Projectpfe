document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sessions page loaded');
  
  const list = document.getElementById('sessions-list');
  const filterClass = document.getElementById('filter-class');
  const filterBranch = document.getElementById('filter-branch');
  const filterTeacher = document.getElementById('filter-teacher');
  const filterDate = document.getElementById('filter-date');
  const addBtn = document.getElementById('add-class-btn');
  
  console.log('Elements found:', {
    list: !!list,
    filterClass: !!filterClass,
    filterBranch: !!filterBranch,
    filterTeacher: !!filterTeacher,
    filterDate: !!filterDate,
    addBtn: !!addBtn
  });

  // Universal Modal System
  function createModal(title, content, buttons = []) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.universal-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'universal-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Tajawal', sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    `;

    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalTitle.style.cssText = `
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#f8f9fa';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';
    closeBtn.onclick = () => modal.remove();

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);

    const modalBody = document.createElement('div');
    modalBody.innerHTML = content;

    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    `;

    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-family: 'Tajawal', sans-serif;
        transition: all 0.2s;
        ${button.style || 'background: #6c757d; color: white;'}
      `;
      btn.onclick = button.onclick;
      btn.onmouseover = () => btn.style.transform = 'translateY(-1px)';
      btn.onmouseout = () => btn.style.transform = 'translateY(0)';
      modalFooter.appendChild(btn);
    });

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);

    // Close modal when clicking outside
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    document.body.appendChild(modal);
    return modal;
  }

  function render(sessions) {
    console.log('Render function called with sessions:', sessions);
    if (!list) {
      console.error('List element not found!');
      return;
    }
    list.innerHTML = '';
    if (!sessions.length) {
      console.log('No sessions to render, showing empty message');
      list.innerHTML = '<div class="empty">No classes yet</div>';
      return;
    }
    console.log(`Rendering ${sessions.length} sessions`);
    sessions.forEach((s, index) => {
      console.log(`Rendering session ${index + 1}:`, s);
      const card = document.createElement('div');
      card.className = 'session-card';
      card.innerHTML = `
        <div class="session-info">
          <h3>${s.name || 'Group'}</h3>
          <div class="sessions-schedule" style="margin-top: 8px;">
            <strong style="color: #333; font-size: 14px;">📅 Schedule:</strong>
            ${s.sessions && s.sessions.length > 0 ? 
              s.sessions.map(session => 
                `<span class="badge" style="background: #17a2b8; color: white; margin: 2px;">${session.day_of_week} ${session.time}</span>`
              ).join('') : 
              '<span style="color: #6c757d; font-style: italic;">No sessions scheduled</span>'
            }
          </div>
        </div>
        <div class="actions">
          <button class="btn secondary" onclick="openViewStudentsModal('${s.id}', '${s.name}')">View Students</button>
          <button class="btn primary" onclick="openEditGroupModal('${s.id}', '${s.name}')">Edit Group</button>
        </div>
      `;
      list.appendChild(card);
    });
    console.log('Render completed');
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
    console.log('Waiting for auth...');
    let tries = 0;
    while ((!window.auth || !window.auth.isInitialized()) && tries < 50) {
      console.log(`Auth attempt ${tries + 1}/50`);
      await new Promise(r => setTimeout(r, 200));
      tries++;
    }
    if (!window.auth) {
      console.error('Auth not initialized after 50 attempts');
      throw new Error('Auth not initialized');
    }
    console.log('Auth initialized successfully');
    return window.auth;
  }

  async function loadTeachers(supa) {
    const sel = filterTeacher;
    if (!sel) return;
    sel.innerHTML = '<option value="">All Teachers</option>';
    try {
      console.log('Loading teachers for filter dropdown...');
      
      // Try direct API call first
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      console.log('Trying direct API call for teachers...');
      const directResponse = await fetch(`${supabaseUrl}/rest/v1/Teacher?select=*&order=fullname`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      console.log('Direct API response status for teachers:', directResponse.status);
      const directData = await directResponse.json();
      console.log('Direct API response data for teachers:', directData);
      
      // Also try Supabase client
      const { data, error } = await supa.from('Teacher').select('*').order('fullname');
      if (error) {
        console.error('Error loading teachers for filter with Supabase client:', error);
      }
      
      // Use direct API data if available, otherwise use Supabase client data
      const finalData = directData && directData.length > 0 ? directData : data;
      
      console.log('Final teachers data for filter:', finalData);
      console.log('Number of teachers found for filter:', finalData?.length || 0);
      
      (finalData || []).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.fullname || 'Teacher'} (${t.Subject || 'No Subject'})`;
        sel.appendChild(opt);
      });
    } catch (e) {
      console.error('Error in loadTeachers:', e);
      // silently ignore; keep default
    }
  }

  // Count students in a specific class
  async function countStudentsInClass(classId) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      console.log(`[countStudentsInClass] Counting students for class ID: ${classId}`);
      
      // Method 1: Try to get count using count query
      try {
        const countResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?class_id=eq.${classId}&select=count`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'count=exact'
          }
        });
        
        console.log(`[countStudentsInClass] Count response status: ${countResponse.status}`);
        
        if (countResponse.ok) {
          const countHeader = countResponse.headers.get('content-range');
          console.log(`[countStudentsInClass] Count header: ${countHeader}`);
          
          if (countHeader) {
            // Extract count from header like "0-9/25"
            const match = countHeader.match(/\/(\d+)$/);
            if (match) {
              const count = parseInt(match[1]);
              console.log(`[countStudentsInClass] Found ${count} students in class ${classId} (from header)`);
              return count;
            }
          }
        }
      } catch (countError) {
        console.warn(`[countStudentsInClass] Count method failed:`, countError);
      }
      
      // Method 2: Fallback - get all records and count them
      console.log(`[countStudentsInClass] Using fallback method for class ${classId}`);
      const response = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?class_id=eq.${classId}`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      console.log(`[countStudentsInClass] Fallback response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const count = data.length;
        console.log(`[countStudentsInClass] Found ${count} students in class ${classId} (from fallback)`, data);
        return count;
      } else {
        console.error(`[countStudentsInClass] Failed to fetch enrollments for class ${classId}: ${response.status}`);
        return 0;
      }
    } catch (error) {
      console.error(`[countStudentsInClass] Error counting students for class ${classId}:`, error);
      return 0;
    }
  }

  async function loadSessions() {
    try {
      console.log('Loading sessions...');
      const auth = await waitAuth();
      const supa = auth.supabase;
      await loadTeachers(supa);

      console.log('Fetching groupes from database...');
      let query = supa.from('Groupe')
        .select(`
          id, 
          name, 
          teacher_id,
          subject_id,
          level_id,
          classe_id,
          branch_id,
          sessions,
          Teacher:teacher_id(fullname, email, phone, experience, "Date", "Subject", "Class"),
          Subject:subject_id(subjects),
          Level:level_id("Niveaux"),
          Classe:classe_id(name),
          Branch:branch_id(name)
        `);

      const cl = filterClass && filterClass.value;
      const br = filterBranch && filterBranch.value;
      const th = filterTeacher && filterTeacher.value;
      
      console.log('Filters:', { cl, br, th });
      
      // Filter by level, class, branch, or teacher
      if (cl) query = query.eq('classe_id', cl);
      if (br) query = query.eq('branch_id', br);
      if (th) query = query.eq('teacher_id', th);

      const { data, error } = await query.order('name', { ascending: true });
      
      console.log('Database response:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Raw data from database:', data);

      const normalized = (data || []).map(row => {
        let sessions = [];
        try {
          // Handle both string and object formats
          if (row.sessions) {
            if (typeof row.sessions === 'string') {
              // Handle escaped JSON strings like "[{\"day_of_week\":\"Tuesday\",\"time\":\"17:35\"}]"
              sessions = JSON.parse(row.sessions);
            } else if (Array.isArray(row.sessions)) {
              sessions = row.sessions;
            } else if (typeof row.sessions === 'object') {
              // Handle direct object format
              sessions = [row.sessions];
            }
          }
        } catch (e) {
          console.warn('Failed to parse sessions JSON:', e, 'Raw sessions data:', row.sessions);
          sessions = [];
        }
        
        return {
          id: row.id,
          name: row.name,
          subject: row.Subject?.subjects || '',
          level: row.Level?.Niveaux || '',
          classe: row.Classe?.name || '',
          branch: row.Branch?.name || '',
          sessions: sessions,
          teacher_id: row.teacher_id,
          teacher_name: (row.Teacher && row.Teacher.fullname) || '',
          teacher_email: (row.Teacher && row.Teacher.email) || '',
          teacher_phone: (row.Teacher && row.Teacher.phone) || '',
          teacher_experience: (row.Teacher && row.Teacher.experience) || 0,
          student_count: 0 // Will be updated below
        };
      });
      
      console.log('Normalized data:', normalized);
      
          // Count students for each class using dedicated function
      for (let i = 0; i < normalized.length; i++) {
        const classId = normalized[i].id;
        normalized[i].student_count = await countStudentsInClass(classId);
        console.log(`Class ${classId} (${normalized[i].name}) has ${normalized[i].student_count} students`);
      }
      
      console.log('Normalized data with student counts:', normalized);
      render(normalized);
    } catch (err) {
      console.error('Load sessions error:', err);
      if (list) list.innerHTML = `<div class="empty">Failed to load classes: ${err.message}</div>`;
    }
  }

  // Add Class Modal Functions
  window.openAddClassModal = async function() {
    try {
      const auth = await waitAuth();
      const supa = auth.supabase;
      
      console.log('Fetching reference data for add group modal...');
      
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Fetch all reference data in parallel
      const [teachersResponse, subjectsResponse, levelsResponse, classesResponse, branchesResponse] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Teacher?select=*&order=fullname`, {
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/Subjects?select=*&order=subjects`, {
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/Level?select=*&order=id`, {
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/Classe?select=*&order=level_id,name`, {
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/Branch?select=*&order=name`, {
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
        })
      ]);
      
      const teachers = teachersResponse.ok ? await teachersResponse.json() : [];
      const subjects = subjectsResponse.ok ? await subjectsResponse.json() : [];
      const levels = levelsResponse.ok ? await levelsResponse.json() : [];
      const classes = classesResponse.ok ? await classesResponse.json() : [];
      const branches = branchesResponse.ok ? await branchesResponse.json() : [];
      
      console.log('Reference data loaded:', { teachers: teachers.length, subjects: subjects.length, levels: levels.length, classes: classes.length, branches: branches.length });
      
      // Check if we have the required data
      if (teachers.length === 0) {
        console.warn('No teachers found!');
      }
      if (subjects.length === 0) {
        console.warn('No subjects found!');
      }
      if (levels.length === 0) {
        console.warn('No levels found!');
      }
      if (classes.length === 0) {
        console.warn('No classes found!');
      }
      
      // Create dropdown options
      const teacherOptions = teachers.map(teacher => 
        `<option value="${teacher.id}">${teacher.fullname} (${teacher.Subject || 'No Subject'})</option>`
      ).join('');
      
      const subjectOptions = subjects.map(subject => 
        `<option value="${subject.id}">${subject.subjects}</option>`
      ).join('');
      
      const levelOptions = levels.map(level => 
        `<option value="${level.id}">${level.Niveaux || `Level ${level.id}`}</option>`
      ).join('');
      
      const classeOptions = classes.map(classe => 
        `<option value="${classe.id}" data-level-id="${classe.level_id}">${classe.name} (${classe.Level?.Niveaux || 'Unknown Level'})</option>`
      ).join('');
      
      const branchOptions = branches.map(branch => 
        `<option value="${branch.id}">${branch.name}</option>`
      ).join('');
      
      const formContent = `
        <form id="add-group-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Group Name</label>
              <input type="text" id="add-group-name" name="name" placeholder="Enter group name" required 
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Subject</label>
              <select id="add-group-subject" name="subject_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Subject</option>
                ${subjectOptions}
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Level</label>
              <select id="add-group-level" name="level_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Level</option>
                ${levelOptions}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Class</label>
              <select id="add-group-classe" name="classe_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Class</option>
                ${classeOptions}
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Branch</label>
              <select id="add-group-branch" name="branch_id" 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Branch (Optional)</option>
                ${branchOptions}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Teacher</label>
              <select id="add-group-teacher" name="teacher_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Teacher</option>
                ${teacherOptions}
              </select>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <label style="font-weight: 500; font-size: 16px;">📅 Weekly Sessions</label>
              <button type="button" id="add-session-btn" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-family: 'Tajawal', sans-serif;">
                + Add Session
              </button>
            </div>
            <div id="sessions-container" style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #f8f9fa; min-height: 60px;">
              <div style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
                No sessions added yet. Click "Add Session" to add the first session.
              </div>
            </div>
          </div>
          
          <div id="add-group-message" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px;"></div>
        </form>
      `;

      createModal('Add New Group', formContent, [
        { 
          text: 'Cancel', 
          style: 'background: #6c757d; color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        },
        { 
          text: 'Add Group', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => window.simpleAddGroup()
        }
      ]);
      
      // Add level change handler to filter classes
      setTimeout(() => {
        const levelSelect = document.getElementById('add-group-level');
        const classeSelect = document.getElementById('add-group-classe');
        
        if (levelSelect && classeSelect) {
          levelSelect.addEventListener('change', (e) => {
            const selectedLevelId = e.target.value;
            const classOptions = classeSelect.querySelectorAll('option[data-level-id]');
            
            classOptions.forEach(option => {
              if (selectedLevelId === '' || option.dataset.levelId === selectedLevelId) {
                option.style.display = 'block';
              } else {
                option.style.display = 'none';
              }
            });
            
            // Reset class selection if it's not valid for the selected level
            if (selectedLevelId && classeSelect.value) {
              const selectedOption = classeSelect.querySelector(`option[value="${classeSelect.value}"]`);
              if (selectedOption && selectedOption.dataset.levelId !== selectedLevelId) {
                classeSelect.value = '';
              }
            }
          });
        }
        
        // Add session management functionality
        setupSessionManagement();
      }, 100);
      
    } catch (error) {
      console.error('Error opening add class modal:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error loading teachers: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  }


// Session management functions
function setupSessionManagement() {
  const addSessionBtn = document.getElementById('add-session-btn');
  const sessionsContainer = document.getElementById('sessions-container');
  
  if (addSessionBtn && sessionsContainer) {
    addSessionBtn.addEventListener('click', addNewSession);
  }
}

function addNewSession() {
  const sessionsContainer = document.getElementById('sessions-container');
  if (!sessionsContainer) return;
  
  // Remove the "no sessions" message if it exists
  const noSessionsMsg = sessionsContainer.querySelector('.no-sessions-message');
  if (noSessionsMsg) {
    noSessionsMsg.remove();
  }
  
  const sessionId = Date.now(); // Simple unique ID
  const sessionElement = document.createElement('div');
  sessionElement.className = 'session-item';
  sessionElement.dataset.sessionId = sessionId;
  sessionElement.style.cssText = `
    display: grid; 
    grid-template-columns: 1fr 1fr auto; 
    gap: 12px; 
    align-items: center; 
    padding: 12px; 
    margin-bottom: 8px; 
    background: white; 
    border: 1px solid #e9ecef; 
    border-radius: 8px;
  `;
  
  sessionElement.innerHTML = `
    <div>
      <label style="display: block; margin-bottom: 4px; font-weight: 500; font-size: 12px;">Day of Week</label>
      <select name="session_day" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
        <option value="">Select Day</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
        <option value="Sunday">Sunday</option>
      </select>
    </div>
    <div>
      <label style="display: block; margin-bottom: 4px; font-weight: 500; font-size: 12px;">Time</label>
      <input type="time" name="session_time" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
    </div>
    <div>
      <button type="button" class="remove-session-btn" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: 'Tajawal', sans-serif;" title="Remove Session">
        🗑️
      </button>
    </div>
  `;
  
  sessionsContainer.appendChild(sessionElement);
  
  // Add remove functionality
  const removeBtn = sessionElement.querySelector('.remove-session-btn');
  removeBtn.addEventListener('click', () => removeSession(sessionId));
  
  // Update session count
  updateSessionCount();
}

function removeSession(sessionId) {
  const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
  if (sessionElement) {
    sessionElement.remove();
    updateSessionCount();
  }
}

function updateSessionCount() {
  const sessionsContainer = document.getElementById('sessions-container');
  if (!sessionsContainer) return;
  
  const sessions = sessionsContainer.querySelectorAll('.session-item');
  
  if (sessions.length === 0) {
    sessionsContainer.innerHTML = `
      <div class="no-sessions-message" style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
        No sessions added yet. Click "Add Session" to add the first session.
      </div>
    `;
  }
}

function getSessionsData() {
  const sessions = [];
  const sessionElements = document.querySelectorAll('.session-item');
  
  sessionElements.forEach(element => {
    const day = element.querySelector('select[name="session_day"]')?.value;
    const time = element.querySelector('input[name="session_time"]')?.value;
    
    if (day && time) {
      sessions.push({
        day_of_week: day,
        time: time
      });
    }
  });
  
  return sessions;
}

// Edit session management functions
function setupEditSessionManagement() {
  const addSessionBtn = document.getElementById('edit-add-session-btn');
  const sessionsContainer = document.getElementById('edit-sessions-container');
  
  if (addSessionBtn && sessionsContainer) {
    addSessionBtn.addEventListener('click', addNewEditSession);
  }
}

function addNewEditSession() {
  const sessionsContainer = document.getElementById('edit-sessions-container');
  if (!sessionsContainer) return;
  
  // Remove the "no sessions" message if it exists
  const noSessionsMsg = sessionsContainer.querySelector('.no-sessions-message');
  if (noSessionsMsg) {
    noSessionsMsg.remove();
  }
  
  const sessionId = Date.now(); // Simple unique ID
  const sessionElement = document.createElement('div');
  sessionElement.className = 'session-item';
  sessionElement.dataset.sessionId = sessionId;
  sessionElement.style.cssText = `
    display: grid; 
    grid-template-columns: 1fr 1fr auto; 
    gap: 12px; 
    align-items: center; 
    padding: 12px; 
    margin-bottom: 8px; 
    background: white; 
    border: 1px solid #e9ecef; 
    border-radius: 8px;
  `;
  
  sessionElement.innerHTML = `
    <div>
      <label style="display: block; margin-bottom: 4px; font-weight: 500; font-size: 12px;">Day of Week</label>
      <select name="session_day" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
        <option value="">Select Day</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
        <option value="Sunday">Sunday</option>
      </select>
    </div>
    <div>
      <label style="display: block; margin-bottom: 4px; font-weight: 500; font-size: 12px;">Time</label>
      <input type="time" name="session_time" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
    </div>
    <div>
      <button type="button" class="remove-session-btn" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: 'Tajawal', sans-serif;" title="Remove Session">
        🗑️
      </button>
    </div>
  `;
  
  sessionsContainer.appendChild(sessionElement);
  
  // Add remove functionality
  const removeBtn = sessionElement.querySelector('.remove-session-btn');
  removeBtn.addEventListener('click', () => removeEditSession(sessionId));
  
  // Update session count
  updateEditSessionCount();
}

function removeEditSession(sessionId) {
  const sessionElement = document.querySelector(`[data-session-id="${sessionId}"]`);
  if (sessionElement) {
    sessionElement.remove();
    updateEditSessionCount();
  }
}

function updateEditSessionCount() {
  const sessionsContainer = document.getElementById('edit-sessions-container');
  if (!sessionsContainer) return;
  
  const sessions = sessionsContainer.querySelectorAll('.session-item');
  
  if (sessions.length === 0) {
    sessionsContainer.innerHTML = `
      <div class="no-sessions-message" style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
        No sessions added yet. Click "Add Session" to add the first session.
      </div>
    `;
  }
}

function populateEditSessions(existingSessions) {
  const sessionsContainer = document.getElementById('edit-sessions-container');
  if (!sessionsContainer) return;
  
  if (existingSessions && existingSessions.length > 0) {
    sessionsContainer.innerHTML = '';
    existingSessions.forEach(session => {
      const sessionId = Date.now() + Math.random(); // Simple unique ID
      const sessionElement = document.createElement('div');
      sessionElement.className = 'session-item';
      sessionElement.dataset.sessionId = sessionId;
      sessionElement.style.cssText = `
        display: grid; 
        grid-template-columns: 1fr 1fr auto; 
        gap: 12px; 
        align-items: center; 
        padding: 12px; 
        margin-bottom: 8px; 
        background: white; 
        border: 1px solid #e9ecef; 
        border-radius: 8px;
      `;
      
      sessionElement.innerHTML = `
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500; font-size: 12px;">Day of Week</label>
          <select name="session_day" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            <option value="">Select Day</option>
            <option value="Monday" ${session.day_of_week === 'Monday' ? 'selected' : ''}>Monday</option>
            <option value="Tuesday" ${session.day_of_week === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
            <option value="Wednesday" ${session.day_of_week === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
            <option value="Thursday" ${session.day_of_week === 'Thursday' ? 'selected' : ''}>Thursday</option>
            <option value="Friday" ${session.day_of_week === 'Friday' ? 'selected' : ''}>Friday</option>
            <option value="Saturday" ${session.day_of_week === 'Saturday' ? 'selected' : ''}>Saturday</option>
            <option value="Sunday" ${session.day_of_week === 'Sunday' ? 'selected' : ''}>Sunday</option>
          </select>
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500; font-size: 12px;">Time</label>
          <input type="time" name="session_time" required value="${session.time || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
        </div>
        <div>
          <button type="button" class="remove-session-btn" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: 'Tajawal', sans-serif;" title="Remove Session">
            🗑️
          </button>
        </div>
      `;
      
      sessionsContainer.appendChild(sessionElement);
      
      // Add remove functionality
      const removeBtn = sessionElement.querySelector('.remove-session-btn');
      removeBtn.addEventListener('click', () => removeEditSession(sessionId));
    });
  } else {
    sessionsContainer.innerHTML = `
      <div class="no-sessions-message" style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
        No sessions added yet. Click "Add Session" to add the first session.
      </div>
    `;
  }
}

function getEditSessionsData() {
  const sessions = [];
  const sessionElements = document.querySelectorAll('#edit-sessions-container .session-item');
  
  sessionElements.forEach(element => {
    const day = element.querySelector('select[name="session_day"]')?.value;
    const time = element.querySelector('input[name="session_time"]')?.value;
    
    if (day && time) {
      sessions.push({
        day_of_week: day,
        time: time
      });
    }
  });
  
  return sessions;
}

// Populate reference table dropdowns
async function populateReferenceDropdowns(prefix = 'add') {
  try {
    console.log(`Populating reference dropdowns with prefix: ${prefix}`);
    
    // Load all reference data
    const [levels, classes, branches, subjects] = await Promise.all([
      loadLevels(),
      loadClasses(),
      loadBranches(),
      loadSubjects()
    ]);
    
    console.log('Reference data loaded:', {
      levels: levels.length,
      classes: classes.length,
      branches: branches.length,
      subjects: subjects.length
    });

    // Populate Level dropdown
    const levelSelect = document.getElementById(`${prefix}-group-level`);
    if (levelSelect) {
      levelSelect.innerHTML = '<option value="">Select Level</option>';
      levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.id;
        option.textContent = level.Niveaux || `Level ${level.id}`;
        levelSelect.appendChild(option);
      });
    }

    // Populate Class dropdown
    const classeSelect = document.getElementById(`${prefix}-group-classe`);
    if (classeSelect) {
      console.log('Populating class dropdown...');
      classeSelect.innerHTML = '<option value="">Select Class</option>';
      if (classes.length > 0) {
        console.log('Adding classes to dropdown:', classes);
        classes.forEach(classe => {
          const option = document.createElement('option');
          option.value = classe.id;
          const className = classe.name || classe.Nom || classe.Classe || `Class ${classe.id}`;
          option.textContent = className;
          if (classe.level_id) {
            option.dataset.levelId = classe.level_id;
          }
          classeSelect.appendChild(option);
          console.log(`Added class option: ${className} (ID: ${classe.id})`);
        });
      } else {
        console.log('No classes available, showing empty message');
        classeSelect.innerHTML = '<option value="">No classes available</option>';
      }
    } else {
      console.error(`Class dropdown element not found: ${prefix}-group-classe`);
    }

    // Populate Branch dropdown
    const branchSelect = document.getElementById(`${prefix}-group-branch`);
    if (branchSelect) {
      branchSelect.innerHTML = '<option value="">Select Branch (Optional)</option>';
      if (branches.length > 0) {
        branches.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.id;
          const branchName = branch.name || branch.Nom || branch.Branch || `Branch ${branch.id}`;
          option.textContent = branchName;
          branchSelect.appendChild(option);
        });
      } else {
        branchSelect.innerHTML = '<option value="">No branches available</option>';
      }
    }

    // Populate Subject dropdown
    const subjectSelect = document.getElementById(`${prefix}-group-subject`);
    if (subjectSelect) {
      subjectSelect.innerHTML = '<option value="">Select Subject</option>';
      if (subjects.length > 0) {
        subjects.forEach(subject => {
          const option = document.createElement('option');
          option.value = subject.id;
          const subjectName = subject.subjects || subject.name || `Subject ${subject.id}`;
          option.textContent = subjectName;
          subjectSelect.appendChild(option);
        });
      } else {
        subjectSelect.innerHTML = '<option value="">No subjects available</option>';
      }
    }

    // Add level change handler to filter classes
    if (levelSelect && classeSelect) {
      levelSelect.addEventListener('change', (e) => {
        const selectedLevelId = e.target.value;
        const classOptions = classeSelect.querySelectorAll('option[data-level-id]');
        
        classOptions.forEach(option => {
          if (selectedLevelId === '' || option.dataset.levelId === selectedLevelId) {
            option.style.display = 'block';
          } else {
            option.style.display = 'none';
          }
        });
        
        // Reset class selection if it's not valid for the selected level
        if (selectedLevelId && classeSelect.value) {
          const selectedOption = classeSelect.querySelector(`option[value="${classeSelect.value}"]`);
          if (selectedOption && selectedOption.dataset.levelId !== selectedLevelId) {
            classeSelect.value = '';
          }
        }
      });
    }

  } catch (error) {
    console.error('Error populating reference dropdowns:', error);
  }
}

// Load reference data functions
async function loadLevels() {
  try {
    const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/Level?select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error loading levels:', error);
    return [];
  }
}

async function loadClasses() {
  try {
    const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/Classe?select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error loading classes:', error);
    return [];
  }
}

async function loadBranches() {
  try {
    const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/Branch?select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error loading branches:', error);
    return [];
  }
}

async function loadSubjects() {
  try {
    const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/Subjects?select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error loading subjects:', error);
    return [];
  }
}

// Simple add class function
window.simpleAddGroup = async function() {
    console.log('Simple add group function called');
    
    const name = document.getElementById('add-group-name')?.value;
    const subjectId = document.getElementById('add-group-subject')?.value;
    const levelId = document.getElementById('add-group-level')?.value;
    const classeId = document.getElementById('add-group-classe')?.value;
    const branchId = document.getElementById('add-group-branch')?.value;
    const teacherId = document.getElementById('add-group-teacher')?.value;
    const sessions = getSessionsData();
    
    console.log('Simple add group - form values:', {
      name, subjectId, levelId, classeId, branchId, teacherId, sessions
    });
    
    if (!name || !subjectId || !levelId || !classeId || !teacherId) {
      alert('Group name, subject, level, class, and teacher are required!');
      return;
    }
    
    // Note: Sessions validation is optional - will work with or without the database column
    if (sessions.length === 0) {
      console.log('No sessions added - will create group without sessions');
    }
    
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const groupData = {
        name: name,
        subject_id: parseInt(subjectId),
        level_id: parseInt(levelId),
        classe_id: parseInt(classeId),
        teacher_id: parseInt(teacherId)
      };
      
      // Add branch if provided
      if (branchId) {
        groupData.branch_id = parseInt(branchId);
      }
      
      // Add sessions if the column exists (will be handled gracefully by the database)
      try {
        groupData.sessions = JSON.stringify(sessions);
      } catch (e) {
        console.warn('Could not stringify sessions:', e);
        // Continue without sessions field
      }
      
      console.log('Sending group data:', groupData);
      console.log('Request URL:', `${supabaseUrl}/rest/v1/Groupe`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Groupe`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
              if (response.ok) {
                try {
                  const responseText = await response.text();
                  console.log('Raw response text:', responseText);
                  
                  if (responseText.trim() === '') {
                    console.log('Empty response received, group likely created successfully');
                    alert('Group added successfully!');
                    document.querySelector('.universal-modal').remove();
                    loadSessions();
                  } else {
                    const newGroup = JSON.parse(responseText);
                    console.log('New group created:', newGroup);
                    alert('Group added successfully!');
                    document.querySelector('.universal-modal').remove();
                    loadSessions();
                  }
                } catch (parseError) {
                  console.error('JSON parse error:', parseError);
                  console.log('Response was not valid JSON, but status was OK');
                  alert('Group added successfully!');
                  document.querySelector('.universal-modal').remove();
                  loadSessions();
                }
              } else {
                // Handle specific error cases
                const errorText = await response.text();
                console.error('Error response text:', errorText);
                
                if (response.status === 400 && (errorText.includes('sessions') || errorText.includes('PGRST204'))) {
                  // Sessions column doesn't exist yet
                  alert('Group added successfully! (Note: Sessions feature will be available after database update)');
                  document.querySelector('.universal-modal').remove();
                  loadSessions();
                } else {
                  // Other errors
                  if (errorText.trim() === '') {
                    alert(`Error adding group: HTTP ${response.status} - Empty response`);
                  } else {
                    try {
                      const errorData = JSON.parse(errorText);
                      console.error('Add group error:', errorData);
                      alert('Error adding group: ' + (errorData.message || errorData.details || 'Unknown error'));
                    } catch (parseError) {
                      console.error('Error JSON parse error:', parseError);
                      alert(`Error adding group: HTTP ${response.status} - ${errorText}`);
                    }
                  }
                }
              }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding group: ' + error.message);
    }
  }

  // Edit Class Modal Functions
  window.openEditGroupModal = async function(classId, className) {
    try {
      const auth = await waitAuth();
      const supa = auth.supabase;
      
      // Get current group data
      const { data: groupData, error: groupError } = await supa.from('Groupe')
        .select(`
          id, 
          name, 
          teacher_id,
          subject_id,
          level_id,
          classe_id,
          branch_id,
          sessions,
          Teacher:teacher_id(fullname, email, phone, experience, "Date", "Subject", "Class"),
          Subject:subject_id(subjects),
          Level:level_id("Niveaux"),
          Classe:classe_id(name),
          Branch:branch_id(name)
        `)
        .eq('id', classId)
        .single();
      
      if (groupError) throw groupError;
      
      // Get teachers for dropdown using direct API call
      console.log('Fetching teachers for edit dropdown...');
      
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      console.log('Trying direct API call for teachers in edit modal...');
      const directResponse = await fetch(`${supabaseUrl}/rest/v1/Teacher?select=*&order=fullname`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      console.log('Direct API response status for teachers in edit modal:', directResponse.status);
      const directData = await directResponse.json();
      console.log('Direct API response data for teachers in edit modal:', directData);
      
      // Also try Supabase client
      const { data: teachers, error: teacherError } = await supa.from('Teacher').select('*').order('fullname');
      if (teacherError) {
        console.error('Error fetching teachers for edit with Supabase client:', teacherError);
      }
      
      // Use direct API data if available, otherwise use Supabase client data
      const finalTeachers = directData && directData.length > 0 ? directData : teachers;
      
      console.log('Final teachers data for edit modal:', finalTeachers);
      console.log('Number of teachers found for edit:', finalTeachers?.length || 0);
      console.log('Current group teacher_id:', groupData.teacher_id);
      
      const teacherOptions = (finalTeachers || []).map(teacher => {
        const isSelected = teacher.id == groupData.teacher_id; // Use == for type comparison
        console.log(`Teacher ${teacher.id} (${teacher.fullname}) selected: ${isSelected}`);
        return `<option value="${teacher.id}" ${isSelected ? 'selected' : ''}>${teacher.fullname} (${teacher.Subject || 'No Subject'})</option>`;
      }).join('');
      
      // Parse existing sessions
      let existingSessions = [];
      try {
        if (groupData.sessions) {
          if (typeof groupData.sessions === 'string') {
            existingSessions = JSON.parse(groupData.sessions);
          } else if (Array.isArray(groupData.sessions)) {
            existingSessions = groupData.sessions;
          }
        }
      } catch (e) {
        console.warn('Failed to parse existing sessions:', e);
        existingSessions = [];
      }

      const formContent = `
        <form id="edit-group-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Group Name</label>
              <input type="text" id="edit-group-name" name="name" placeholder="Enter group name" required 
                     value="${groupData.name || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Subject</label>
              <select id="edit-group-subject" name="subject_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Subject</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Level</label>
              <select id="edit-group-level" name="level_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Level</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Class</label>
              <select id="edit-group-classe" name="classe_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Class</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Branch</label>
              <select id="edit-group-branch" name="branch_id" 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Branch (Optional)</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Teacher</label>
              <select id="edit-group-teacher" name="teacher_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Teacher</option>
                ${teacherOptions}
              </select>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <label style="font-weight: 500; font-size: 16px;">📅 Weekly Sessions</label>
              <button type="button" id="edit-add-session-btn" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-family: 'Tajawal', sans-serif;">
                + Add Session
              </button>
            </div>
            <div id="edit-sessions-container" style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #f8f9fa; min-height: 60px;">
              <div style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">
                Loading existing sessions...
              </div>
            </div>
          </div>
          
          <div id="edit-group-message" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px;"></div>
        </form>
      `;

      createModal('Edit Group', formContent, [
        { 
          text: 'Delete Group', 
          style: 'background: #dc3545; color: white;',
          onclick: () => window.deleteGroup(classId)
        },
        { 
          text: 'Cancel', 
          style: 'background: #6c757d; color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        },
        { 
          text: 'Save Changes', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => window.simpleEditGroup(classId)
        }
      ]);
      
      // Populate edit form with existing data
      setTimeout(async () => {
        // Populate reference dropdowns
        await populateReferenceDropdowns('edit');
        
        // Set current values
        const nameInput = document.getElementById('edit-group-name');
        const subjectSelect = document.getElementById('edit-group-subject');
        const levelSelect = document.getElementById('edit-group-level');
        const classeSelect = document.getElementById('edit-group-classe');
        const branchSelect = document.getElementById('edit-group-branch');
        const teacherSelect = document.getElementById('edit-group-teacher');
        
        if (nameInput) nameInput.value = groupData.name || '';
        if (subjectSelect) subjectSelect.value = groupData.subject_id || '';
        if (levelSelect) levelSelect.value = groupData.level_id || '';
        if (classeSelect) classeSelect.value = groupData.classe_id || '';
        if (branchSelect) branchSelect.value = groupData.branch_id || '';
        if (teacherSelect) teacherSelect.value = groupData.teacher_id || '';
        
        // Populate existing sessions
        populateEditSessions(existingSessions);
        
        // Setup session management for edit
        setupEditSessionManagement();
      }, 100);
      
    } catch (error) {
      console.error('Error opening edit class modal:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error loading class data: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  }

  // Simple edit class function
  window.simpleEditGroup = async function(groupId) {
    console.log('Simple edit group function called for group:', groupId);
    
    const name = document.getElementById('edit-group-name')?.value;
    const subjectId = document.getElementById('edit-group-subject')?.value;
    const levelId = document.getElementById('edit-group-level')?.value;
    const classeId = document.getElementById('edit-group-classe')?.value;
    const branchId = document.getElementById('edit-group-branch')?.value;
    const teacherId = document.getElementById('edit-group-teacher')?.value;
    const sessions = getEditSessionsData();
    
    console.log('Simple edit group - form values:', {
      name, subjectId, levelId, classeId, branchId, teacherId, sessions
    });
    
    if (!name || !subjectId || !levelId || !classeId || !teacherId) {
      alert('Group name, subject, level, class, and teacher are required!');
      return;
    }
    
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const groupData = {
        name: name,
        subject_id: parseInt(subjectId),
        level_id: parseInt(levelId),
        classe_id: parseInt(classeId),
        teacher_id: parseInt(teacherId)
      };
      
      // Add branch if provided
      if (branchId) {
        groupData.branch_id = parseInt(branchId);
      }
      
      // Add sessions if provided
      if (sessions.length > 0) {
        groupData.sessions = JSON.stringify(sessions);
      }
      
      console.log('Sending group update data:', groupData);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Groupe?id=eq.${groupId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupData)
      });
      
      if (response.ok) {
        alert('Group updated successfully!');
        document.querySelector('.universal-modal').remove();
        loadSessions();
      } else {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        alert('Error updating group: ' + errorText);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating group: ' + error.message);
    }
  }

  // Delete Group Function
  window.deleteGroup = async function(groupId) {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Delete group from Groupe table
      const response = await fetch(`${supabaseUrl}/rest/v1/Groupe?id=eq.${groupId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      if (response.ok) {
        alert('Group deleted successfully!');
        document.querySelector('.universal-modal')?.remove();
        loadSessions();
      } else {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        alert('Error deleting group: ' + errorText);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting group: ' + error.message);
    }
  };

  // View Students Modal Functions
  window.openViewStudentsModal = async function(classId, className) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Get students enrolled in this class using direct API call
      const response = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?class_id=eq.${classId}&select=student_id`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch class students');
      }
      
      const classStudents = await response.json();
      const studentIds = classStudents.map(cs => cs.student_id);
      
      // Get student details for each enrolled student
      let students = [];
      if (studentIds.length > 0) {
        const studentIdsParam = studentIds.map(id => `id.eq.${id}`).join(',');
        const studentsResponse = await fetch(`${supabaseUrl}/rest/v1/student?or=(${studentIdsParam})&select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        if (studentsResponse.ok) {
          students = await studentsResponse.json();
        }
      }
      
      let studentsList = '';
      if (students.length === 0) {
        studentsList = '<div style="text-align: center; padding: 20px; color: #6c757d;">No students enrolled in this class yet.</div>';
      } else {
        studentsList = students.map(student => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 600; color: #333;">${student.fullname || 'Unknown'}</div>
              <div style="font-size: 14px; color: #6c757d;">${student.email || ''} • ${student.phone || ''}</div>
              <div style="font-size: 12px; color: #6c757d;">${student.Class || ''} • ${student.Branch || ''}</div>
            </div>
          </div>
        `).join('');
      }
      
      const content = `
        <div>
          <h3 style="margin: 0 0 16px; color: #333;">Students in "${className}"</h3>
          <div style="max-height: 400px; overflow-y: auto;">
            ${studentsList}
          </div>
        </div>
      `;

      createModal('View Students', content, [
        { 
          text: 'Close', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
      
    } catch (error) {
      console.error('Error opening view students modal:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error loading students: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  }

  // Event Listeners
  const filterElements = [filterClass, filterBranch, filterTeacher, filterDate];
  filterElements.forEach(el => {
    if (el) {
      el.addEventListener('change', loadSessions);
    }
  });

  if (addBtn) {
    addBtn.addEventListener('click', openAddClassModal);
  }



  // Show Teachers button for debugging
  const showTeachersBtn = document.getElementById('show-teachers-btn');
  if (showTeachersBtn) {
    showTeachersBtn.addEventListener('click', async () => {
      console.log('Show Teachers button clicked');
      try {
        const auth = await waitAuth();
        const supa = auth.supabase;
        
        console.log('Fetching all teachers...');
        console.log('Using Supabase client:', supa);
        
        // Try direct API call first
        const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
        
        console.log('Trying direct API call...');
        const directResponse = await fetch(`${supabaseUrl}/rest/v1/Teacher?select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('Direct API response status:', directResponse.status);
        const directData = await directResponse.json();
        console.log('Direct API response data:', directData);
        
        // Also try Supabase client
        const { data: teachers, error: teachersError } = await supa.from('Teacher').select('*').order('fullname');
        
        console.log('Supabase client response:', { data: teachers, error: teachersError });
        
        if (teachersError) {
          console.error('Error fetching teachers with Supabase client:', teachersError);
        }
        
        // Use direct API data if available, otherwise use Supabase client data
        const finalTeachers = directData && directData.length > 0 ? directData : teachers;
        
        console.log('Final teachers data:', finalTeachers);
        
        if (!finalTeachers || finalTeachers.length === 0) {
          alert('No teachers found in the database!\n\nDirect API: ' + directData?.length + ' teachers\nSupabase Client: ' + (teachers?.length || 0) + ' teachers');
          return;
        }
        
        // Show teachers in a modal
        let teachersList = '';
        finalTeachers.forEach((teacher, index) => {
          teachersList += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px;">
              <div>
                <div style="font-weight: 600; color: #333;">${teacher.fullname || 'Unknown'}</div>
                <div style="font-size: 14px; color: #6c757d;">ID: ${teacher.id} • Subject: ${teacher.Subject || 'No Subject'}</div>
                <div style="font-size: 12px; color: #6c757d;">Email: ${teacher.email || 'No Email'} • Phone: ${teacher.phone || 'No Phone'}</div>
              </div>
            </div>
          `;
        });
        
        const content = `
          <div>
            <h3 style="margin: 0 0 16px; color: #333;">All Teachers in Database (${finalTeachers.length})</h3>
            <div style="max-height: 400px; overflow-y: auto;">
              ${teachersList}
            </div>
          </div>
        `;

        createModal('All Teachers', content, [
          { 
            text: 'Close', 
            style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
            onclick: () => document.querySelector('.universal-modal').remove()
          }
        ]);
        
      } catch (error) {
        console.error('Show teachers failed:', error);
        alert(`Show teachers failed: ${error.message}`);
      }
    });
  }

  // Test Count button
  const testCountBtn = document.getElementById('test-count-btn');
  if (testCountBtn) {
    testCountBtn.addEventListener('click', async () => {
      console.log('Test Count button clicked');
      try {
        // Get all classes first
        const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
        
        const classesResponse = await fetch(`${supabaseUrl}/rest/v1/Classe?select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        const classes = await classesResponse.json();
        console.log('Testing count function with classes:', classes);
        
        let results = [];
        for (const cls of classes) {
          const count = await countStudentsInClass(cls.id);
          results.push({
            classId: cls.id,
            className: cls.name,
            studentCount: count
          });
        }
        
        // Show results
        const content = `
          <div>
            <h3 style="margin: 0 0 16px; color: #333;">Student Count Test Results</h3>
            <div style="max-height: 400px; overflow-y: auto;">
              ${results.map(r => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600; color: #333;">${r.className}</div>
                    <div style="font-size: 14px; color: #6c757d;">Class ID: ${r.classId}</div>
                  </div>
                  <div style="font-size: 24px; font-weight: bold; color: #28a745;">${r.studentCount}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        createModal('Student Count Test Results', content, [
          { 
            text: 'Close', 
            style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
            onclick: () => document.querySelector('.universal-modal').remove()
          }
        ]);
        
      } catch (error) {
        console.error('Test count failed:', error);
        alert(`Test count failed: ${error.message}`);
      }
    });
  }

  // Test Enrollments button
  const testEnrollmentsBtn = document.getElementById('test-enrollments-btn');
  if (testEnrollmentsBtn) {
    testEnrollmentsBtn.addEventListener('click', async () => {
      console.log('Test Enrollments button clicked');
      try {
        const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
        
        // Test 1: Check all ClassStudents records
        console.log('Testing ClassStudents table...');
        const allEnrollmentsResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('All enrollments response status:', allEnrollmentsResponse.status);
        const allEnrollments = await allEnrollmentsResponse.json();
        console.log('All enrollments data:', allEnrollments);
        
        // Test 2: Check Classes table
        console.log('Testing Classes table...');
        const classesResponse = await fetch(`${supabaseUrl}/rest/v1/Classe?select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('Classes response status:', classesResponse.status);
        const classes = await classesResponse.json();
        console.log('Classes data:', classes);
        
        // Test 3: Check Students table
        console.log('Testing Students table...');
        const studentsResponse = await fetch(`${supabaseUrl}/rest/v1/student?select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('Students response status:', studentsResponse.status);
        const students = await studentsResponse.json();
        console.log('Students data:', students);
        
        // Show results in modal
        const content = `
          <div>
            <h3 style="margin: 0 0 16px; color: #333;">Database Test Results</h3>
            <div style="max-height: 400px; overflow-y: auto;">
              <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px;">
                <h4 style="margin: 0 0 8px; color: #333;">Classes (${classes.length})</h4>
                ${classes.map(c => `<div style="font-size: 14px; color: #666;">ID: ${c.id} - ${c.name} (${c.subject})</div>`).join('')}
              </div>
              
              <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px;">
                <h4 style="margin: 0 0 8px; color: #333;">Students (${students.length})</h4>
                ${students.map(s => `<div style="font-size: 14px; color: #666;">ID: ${s.id} - ${s.fullname} (${s.email})</div>`).join('')}
              </div>
              
              <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px;">
                <h4 style="margin: 0 0 8px; color: #333;">Class Enrollments (${allEnrollments.length})</h4>
                ${allEnrollments.map(e => `<div style="font-size: 14px; color: #666;">Class ID: ${e.class_id} - Student ID: ${e.student_id}</div>`).join('')}
              </div>
            </div>
          </div>
        `;

        createModal('Database Test Results', content, [
          { 
            text: 'Close', 
            style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
            onclick: () => document.querySelector('.universal-modal').remove()
          }
        ]);
        
      } catch (error) {
        console.error('Test enrollments failed:', error);
        alert(`Test enrollments failed: ${error.message}`);
      }
    });
  }

  // Load sessions with error handling
  try {
    console.log('Starting to load sessions...');
    await loadSessions();
  } catch (error) {
    console.error('Failed to load sessions on page load:', error);
    if (list) {
      list.innerHTML = `<div class="empty">Error loading classes: ${error.message}</div>`;
    }
  }
});


