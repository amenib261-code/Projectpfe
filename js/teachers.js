// Teachers Management JavaScript

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[teachers] init');
  const list = document.getElementById('teachers-list');
  const filterSubject = document.getElementById('filter-subject');
  const searchInput = document.getElementById('search-teachers');
  const addBtn = document.getElementById('add-teacher-btn');

  function render(teachers) {
    if (!list) return;
    list.innerHTML = '';
    if (!teachers.length) {
      list.innerHTML = '<tr><td colspan="7" class="empty">No teachers found</td></tr>';
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
            <button class="btn secondary" data-id="${t.id}">Edit</button>
            <button class="btn primary" data-id="${t.id}">View</button>
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

  // Initial load
  loadTeachers();
});
