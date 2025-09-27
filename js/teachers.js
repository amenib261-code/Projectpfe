// Teachers Management JavaScript

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[teachers] init');
  const list = document.getElementById('teachers-list');
  const filterSubject = document.getElementById('filter-subject');
  const searchInput = document.getElementById('search-teachers');
  const addBtn = document.getElementById('add-teacher-btn');

  // Universal Modal System
  function createModal(title, content, buttons = []) {
    // Remove any existing modal
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
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Tajawal', sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      width: min(600px, 95vw);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    `;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0;
      font-size: 18px;
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
    `;
    closeBtn.onclick = () => modal.remove();

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = `
      padding: 20px;
    `;
    body.innerHTML = content;

    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 20px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      background: #f8f9fa;
    `;

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.style.cssText = `
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        font-family: 'Tajawal', sans-serif;
        ${btn.style || 'background: #6c757d; color: white;'}
      `;
      button.onclick = btn.onclick;
      footer.appendChild(button);
    });

    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);

    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    document.body.appendChild(modal);
    return modal;
  }

  function render(teachers) {
    if (!list) return;
    list.innerHTML = '';
    if (!teachers.length) {
      list.innerHTML = '<tr><td colspan="8" class="empty">No teachers found</td></tr>';
      return;
    }
    teachers.forEach(t => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${t.fullname || 'Teacher'}</strong></td>
        <td>${t.email || ''}</td>
        <td>${t.phone || 'No phone'}</td>
        <td><span class="badge">${t.Subject || 'No subject'}</span></td>
        <td><span class="badge">${t.Class || 'No class'}</span></td>
        <td><span class="badge">${t.experience || 0} years</span></td>
        <td>${formatDate(t.Date)}</td>
        <td>
          <div class="actions">
            <button class="btn secondary" onclick="openEditTeacherModal(${t.id}, '${t.fullname || 'Teacher'}')">Edit</button>
            <button class="btn primary" onclick="openViewTeacherModal(${t.id}, '${t.fullname || 'Teacher'}')">View</button>
            <button class="btn danger" onclick="handleDeleteTeacher(${t.id}, '${t.fullname || 'Teacher'}')">Delete</button>
          </div>
        </td>
      `;
      list.appendChild(row);
    });
  }

  function formatDate(d) {
    try { 
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString(); 
    } catch { 
      return d || 'N/A'; 
    }
  }

  let allTeachers = []; // Store all teachers for filtering
  let currentPage = 1;
  const itemsPerPage = 10;

  async function loadTeachers() {
    try {
      // Use service role key to bypass RLS
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Get all teachers from Teacher table
      let url = `${supabaseUrl}/rest/v1/Teacher?select=*`;
      console.log('Fetching teachers from URL:', url);
      
      const res = await fetch(url, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Supabase API error: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Received teachers data:', data);
      allTeachers = data || [];
      filterAndRenderTeachers();
    } catch (err) {
      if (list) list.innerHTML = '<tr><td colspan="8" class="empty">Failed to load teachers: ' + err.message + '</td></tr>';
      console.error('Load teachers error:', err);
    }
  }

  function filterAndRenderTeachers() {
    const search = searchInput && searchInput.value.trim().toLowerCase();
    
    let filteredTeachers = allTeachers;
    
    // Apply search filter
    if (search) {
      filteredTeachers = allTeachers.filter(teacher => {
        const fullname = (teacher.fullname || '').toLowerCase();
        const email = (teacher.email || '').toLowerCase();
        const phone = (teacher.phone || '').toString();
        const experience = (teacher.experience || '').toString();
        const subject = (teacher.Subject || '').toLowerCase();
        const classLevel = (teacher.Class || '').toLowerCase();
        
        return fullname.includes(search) || 
               email.includes(search) || 
               phone.includes(search) || 
               experience.includes(search) ||
               subject.includes(search) ||
               classLevel.includes(search);
      });
    }
    
    currentPage = 1; // Reset to first page when filtering
    renderPaginatedTeachers(filteredTeachers);
  }

  function renderPaginatedTeachers(teachers) {
    const totalPages = Math.ceil(teachers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTeachers = teachers.slice(startIndex, endIndex);
    
    render(pageTeachers);
    updatePagination(teachers.length, totalPages);
  }

  function updatePagination(totalItems, totalPages) {
    const paginationInfo = document.getElementById('teachers-pagination-info');
    const prevBtn = document.getElementById('prev-teachers-page-btn');
    const nextBtn = document.getElementById('next-teachers-page-btn');
    const pageNumbers = document.getElementById('teachers-page-numbers');
    
    if (paginationInfo) {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} teachers`;
    }
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    if (pageNumbers) {
      pageNumbers.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('span');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          const search = searchInput && searchInput.value.trim().toLowerCase();
          let filteredTeachers = allTeachers;
          
          if (search) {
            filteredTeachers = allTeachers.filter(teacher => {
              const fullname = (teacher.fullname || '').toLowerCase();
              const email = (teacher.email || '').toLowerCase();
              const phone = (teacher.phone || '').toString();
              const experience = (teacher.experience || '').toString();
              const subject = (teacher.Subject || '').toLowerCase();
              const classLevel = (teacher.Class || '').toLowerCase();
              
              return fullname.includes(search) || 
                     email.includes(search) || 
                     phone.includes(search) || 
                     experience.includes(search) ||
                     subject.includes(search) ||
                     classLevel.includes(search);
            });
          }
          
          renderPaginatedTeachers(filteredTeachers);
        });
        pageNumbers.appendChild(pageBtn);
      }
    }
  }

  // Event listeners
  if (filterSubject) filterSubject.addEventListener('change', loadTeachers);
  if (searchInput) searchInput.addEventListener('input', filterAndRenderTeachers);
  
  // Pagination event listeners
  const prevBtn = document.getElementById('prev-teachers-page-btn');
  const nextBtn = document.getElementById('next-teachers-page-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        const search = searchInput && searchInput.value.trim().toLowerCase();
        let filteredTeachers = allTeachers;
        
        if (search) {
          filteredTeachers = allTeachers.filter(teacher => {
            const fullname = (teacher.fullname || '').toLowerCase();
            const email = (teacher.email || '').toLowerCase();
            const phone = (teacher.phone || '').toString();
            const experience = (teacher.experience || '').toString();
            const subject = (teacher.Subject || '').toLowerCase();
            const classLevel = (teacher.Class || '').toLowerCase();
            
            return fullname.includes(search) || 
                   email.includes(search) || 
                   phone.includes(search) || 
                   experience.includes(search) ||
                   subject.includes(search) ||
                   classLevel.includes(search);
          });
        }
        
        renderPaginatedTeachers(filteredTeachers);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allTeachers.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        const search = searchInput && searchInput.value.trim().toLowerCase();
        let filteredTeachers = allTeachers;
        
        if (search) {
          filteredTeachers = allTeachers.filter(teacher => {
            const fullname = (teacher.fullname || '').toLowerCase();
            const email = (teacher.email || '').toLowerCase();
            const phone = (teacher.phone || '').toString();
            const experience = (teacher.experience || '').toString();
            const subject = (teacher.Subject || '').toLowerCase();
            const classLevel = (teacher.Class || '').toLowerCase();
            
            return fullname.includes(search) || 
                   email.includes(search) || 
                   phone.includes(search) || 
                   experience.includes(search) ||
                   subject.includes(search) ||
                   classLevel.includes(search);
          });
        }
        
        renderPaginatedTeachers(filteredTeachers);
      }
    });
  }

  // Add Teacher Modal Functions
  function openAddTeacherModal() {
    const formContent = `
      <form id="add-teacher-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Full Name</label>
            <input type="text" id="add-fullname" name="fullname" placeholder="Enter full name" required 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Email Address</label>
            <input type="email" id="add-email" name="email" placeholder="example@mail.com" required 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Phone Number</label>
            <input type="tel" id="add-phone" name="phone" placeholder="e.g., 50123456" required 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Experience (Years)</label>
            <input type="number" id="add-experience" name="experience" placeholder="e.g., 5" required 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Subject</label>
            <select id="add-subject" name="subject" required 
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
              <option value="">Select Subject</option>
              <option value="programming">Programming</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="english">English</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Class</label>
            <select id="add-class" name="class" required 
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
              <option value="">Select Class</option>
              <option value="2eme">2ème année</option>
              <option value="3eme">3ème année</option>
              <option value="bac">Bac informatique</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 500;">Date</label>
          <input type="date" id="add-date" name="date" 
                 style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
        </div>
        
        <div id="add-teacher-message" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px;"></div>
      </form>
    `;

    createModal('Add New Teacher', formContent, [
      { 
        text: 'Cancel', 
        style: 'background: #6c757d; color: white;',
        onclick: () => document.querySelector('.universal-modal').remove()
      },
      { 
        text: 'Add Teacher', 
        style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
        onclick: () => window.simpleAddTeacher()
      }
    ]);
  }

  // Simple add teacher function
  window.simpleAddTeacher = async function() {
    console.log('Simple add teacher function called');
    
    const fullname = document.getElementById('add-fullname')?.value;
    const email = document.getElementById('add-email')?.value;
    const phone = document.getElementById('add-phone')?.value;
    const experience = document.getElementById('add-experience')?.value;
    const subject = document.getElementById('add-subject')?.value;
    const classLevel = document.getElementById('add-class')?.value;
    const date = document.getElementById('add-date')?.value;
    
    console.log('Simple add teacher - form values:', {
      fullname, email, phone, experience, subject, classLevel, date
    });
    
    if (!fullname || !email || !phone || !experience || !subject || !classLevel) {
      alert('All fields are required!');
      return;
    }
    
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Teacher`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: fullname,
          email: email,
          phone: parseInt(phone),
          experience: parseInt(experience),
          Subject: subject,
          Class: classLevel,
          Date: date || new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        alert('Teacher added successfully!');
        document.querySelector('.universal-modal')?.remove();
        loadTeachers();
      } else {
        const error = await response.text();
        alert('Error adding teacher: ' + error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding teacher: ' + error.message);
    }
  };

  // Edit Teacher Modal Functions
  window.openEditTeacherModal = async function(teacherId, teacherName) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Teacher?id=eq.${teacherId}`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch teacher data');
      }
      
      const teachers = await response.json();
      const teacher = teachers[0];
      
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      
      const formContent = `
        <form id="edit-teacher-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Full Name</label>
              <input type="text" id="edit-fullname" name="fullname" placeholder="Enter full name" required 
                     value="${teacher.fullname || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Email Address</label>
              <input type="email" id="edit-email" name="email" placeholder="example@mail.com" required 
                     value="${teacher.email || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Phone Number</label>
              <input type="tel" id="edit-phone" name="phone" placeholder="e.g., 50123456" required 
                     value="${teacher.phone || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Experience (Years)</label>
              <input type="number" id="edit-experience" name="experience" placeholder="e.g., 5" required 
                     value="${teacher.experience || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Subject</label>
              <select id="edit-subject" name="subject" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Subject</option>
                <option value="programming" ${teacher.Subject === 'programming' ? 'selected' : ''}>Programming</option>
                <option value="mathematics" ${teacher.Subject === 'mathematics' ? 'selected' : ''}>Mathematics</option>
                <option value="science" ${teacher.Subject === 'science' ? 'selected' : ''}>Science</option>
                <option value="english" ${teacher.Subject === 'english' ? 'selected' : ''}>English</option>
                <option value="other" ${teacher.Subject === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Class</label>
              <select id="edit-class" name="class" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Class</option>
                <option value="2eme" ${teacher.Class === '2eme' ? 'selected' : ''}>2ème année</option>
                <option value="3eme" ${teacher.Class === '3eme' ? 'selected' : ''}>3ème année</option>
                <option value="bac" ${teacher.Class === 'bac' ? 'selected' : ''}>Bac informatique</option>
                <option value="other" ${teacher.Class === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Date</label>
            <input type="date" id="edit-date" name="date" 
                   value="${teacher.Date ? teacher.Date.split('T')[0] : ''}"
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
          </div>
          
          <div id="edit-teacher-message" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px;"></div>
        </form>
      `;

      createModal('Edit Teacher', formContent, [
        { 
          text: 'Cancel', 
          style: 'background: #6c757d; color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        },
        { 
          text: 'Save Changes', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => window.simpleEditTeacher(teacherId)
        }
      ]);
      
    } catch (error) {
      console.error('Error opening edit modal:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error loading teacher data: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  };

  // Simple edit teacher function
  window.simpleEditTeacher = async function(teacherId) {
    console.log('Simple edit teacher function called for teacher:', teacherId);
    
    const fullname = document.getElementById('edit-fullname')?.value;
    const email = document.getElementById('edit-email')?.value;
    const phone = document.getElementById('edit-phone')?.value;
    const experience = document.getElementById('edit-experience')?.value;
    const subject = document.getElementById('edit-subject')?.value;
    const classLevel = document.getElementById('edit-class')?.value;
    const date = document.getElementById('edit-date')?.value;
    
    console.log('Simple edit teacher - form values:', {
      fullname, email, phone, experience, subject, classLevel, date
    });
    
    if (!fullname || !email || !phone || !experience || !subject || !classLevel) {
      alert('All fields are required!');
      return;
    }
    
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Teacher?id=eq.${teacherId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: fullname,
          email: email,
          phone: parseInt(phone),
          experience: parseInt(experience),
          Subject: subject,
          Class: classLevel,
          Date: date || new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        alert('Teacher updated successfully!');
        document.querySelector('.universal-modal')?.remove();
        loadTeachers();
      } else {
        const error = await response.text();
        alert('Error updating teacher: ' + error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating teacher: ' + error.message);
    }
  };

  // View Teacher Modal Functions
  window.openViewTeacherModal = async function(teacherId, teacherName) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Teacher?id=eq.${teacherId}`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch teacher data');
      }
      
      const teachers = await response.json();
      const teacher = teachers[0];
      
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      
      const content = `
        <div style="display: grid; gap: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Full Name</label>
              <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${teacher.fullname || 'N/A'}</div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Email Address</label>
              <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${teacher.email || 'N/A'}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Phone Number</label>
              <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${teacher.phone || 'N/A'}</div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Experience</label>
              <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${teacher.experience || 0} years</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Subject</label>
              <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${teacher.Subject || 'N/A'}</div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Class</label>
              <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${teacher.Class || 'N/A'}</div>
            </div>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #666;">Date</label>
            <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">${formatDate(teacher.Date)}</div>
          </div>
        </div>
      `;

      createModal('View Teacher Details', content, [
        { 
          text: 'Close', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
      
    } catch (error) {
      console.error('Error opening view modal:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error loading teacher data: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  };

  // Delete Teacher Functions
  window.handleDeleteTeacher = function(teacherId, teacherName) {
    createModal('Confirm Delete', `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">⚠️</div>
        <p style="margin: 0; font-size: 16px;">Are you sure you want to delete teacher <strong>"${teacherName}"</strong>?</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #666;">This action cannot be undone.</p>
      </div>
    `, [
      { 
        text: 'Cancel', 
        style: 'background: #6c757d; color: white;',
        onclick: () => document.querySelector('.universal-modal').remove()
      },
      { 
        text: 'Delete', 
        style: 'background: linear-gradient(45deg, #dc3545, #c82333); color: white;',
        onclick: () => window.confirmDeleteTeacher(teacherId, teacherName)
      }
    ]);
  };

  window.confirmDeleteTeacher = async function(teacherId, teacherName) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Teacher?id=eq.${teacherId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        document.querySelector('.universal-modal').remove();
        createModal('Success', `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; color: #28a745; margin-bottom: 16px;">✅</div>
            <p style="margin: 0; font-size: 16px;">Teacher "${teacherName}" has been deleted successfully!</p>
          </div>
        `, [
          { 
            text: 'OK', 
            style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
            onclick: () => {
              document.querySelector('.universal-modal').remove();
              loadTeachers();
            }
          }
        ]);
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      document.querySelector('.universal-modal').remove();
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error deleting teacher: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  };

  // Add event listener for add teacher button
  if (addBtn) {
    addBtn.addEventListener('click', openAddTeacherModal);
  }

  // Initial load
  loadTeachers();
});
