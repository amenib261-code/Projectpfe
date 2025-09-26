// Students Management JavaScript

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[students] init');
  const list = document.getElementById('students-list');
  const filterClass = document.getElementById('filter-class');
  const searchInput = document.getElementById('search-students');
  const addBtn = document.getElementById('add-student-btn');

  function render(students) {
    if (!list) return;
    list.innerHTML = '';
    if (!students.length) {
      list.innerHTML = '<tr><td colspan="7" class="empty">No students found</td></tr>';
            return;
        }
    students.forEach(s => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${s.fullname || 'Student'}</strong></td>
        <td>${s.email || ''}</td>
        <td>${s.number || 'No phone'}</td>
        <td><span class="badge">${s.class || ''}</span></td>
        <td>${s.branch || ''}</td>
        <td>${formatDate(s.created_at)}</td>
        <td>
          <div class="actions">
            <button class="btn secondary" data-id="${s.id}">Edit</button>
            <button class="btn primary" data-id="${s.id}">View</button>
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

  async function waitAuth() {
    let tries = 0;
    while ((!window.auth || !window.auth.isInitialized()) && tries < 50) {
      await new Promise(r => setTimeout(r, 200));
      tries++;
    }
    if (!window.auth) throw new Error('Auth not initialized');
    return window.auth;
  }

  let allStudents = []; // Store all students for filtering
  let currentPage = 1;
  const itemsPerPage = 10;

  async function loadStudents() {
    try {
      // Use service role key to bypass RLS
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Only filter by class in the API call, search will be done client-side
      const params = new URLSearchParams();
      const cl = filterClass && filterClass.value;
      if (cl) params.set('class', `eq.${cl}`);
      
      // Try without any filters first to test basic connectivity
      let url = `${supabaseUrl}/rest/v1/Users?select=*`;
      if (cl) {
        url = `${supabaseUrl}/rest/v1/Users?select=*&class=eq.${cl}`;
      }
      console.log('Fetching from URL:', url);
      
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
      console.log('Received data:', data);
      allStudents = data || [];
      filterAndRenderStudents();
    } catch (err) {
      if (list) list.innerHTML = '<tr><td colspan="7" class="empty">Failed to load students: ' + err.message + '</td></tr>';
      console.error('Load students error:', err);
    }
  }

  function filterAndRenderStudents() {
    const search = searchInput && searchInput.value.trim().toLowerCase();
    
    let filteredStudents = allStudents;
    
    // Apply search filter
    if (search) {
      filteredStudents = allStudents.filter(student => {
        const fullname = (student.fullname || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const phone = (student.number || '').toString();
        const branch = (student.branch || '').toLowerCase();
        
        return fullname.includes(search) || 
               email.includes(search) || 
               phone.includes(search) || 
               branch.includes(search);
      });
    }
    
    currentPage = 1; // Reset to first page when filtering
    renderPaginatedStudents(filteredStudents);
  }

  function renderPaginatedStudents(students) {
    const totalPages = Math.ceil(students.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageStudents = students.slice(startIndex, endIndex);
    
    render(pageStudents);
    updatePagination(students.length, totalPages);
  }

  function updatePagination(totalItems, totalPages) {
    const paginationInfo = document.getElementById('students-pagination-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const pageNumbers = document.getElementById('page-numbers');
    
    if (paginationInfo) {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} students`;
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
          let filteredStudents = allStudents;
          
          if (search) {
            filteredStudents = allStudents.filter(student => {
              const fullname = (student.fullname || '').toLowerCase();
              const email = (student.email || '').toLowerCase();
              const phone = (student.number || '').toString();
              const branch = (student.branch || '').toLowerCase();
              
              return fullname.includes(search) || 
                     email.includes(search) || 
                     phone.includes(search) || 
                     branch.includes(search);
            });
          }
          
          renderPaginatedStudents(filteredStudents);
        });
        pageNumbers.appendChild(pageBtn);
      }
    }
  }


  // Event listeners
  if (filterClass) filterClass.addEventListener('change', loadStudents);
  if (searchInput) searchInput.addEventListener('input', filterAndRenderStudents);
  
  // Pagination event listeners
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        const search = searchInput && searchInput.value.trim().toLowerCase();
        let filteredStudents = allStudents;
        
        if (search) {
          filteredStudents = allStudents.filter(student => {
            const fullname = (student.fullname || '').toLowerCase();
            const email = (student.email || '').toLowerCase();
            const phone = (student.number || '').toString();
            const branch = (student.branch || '').toLowerCase();
            
            return fullname.includes(search) || 
                   email.includes(search) || 
                   phone.includes(search) || 
                   branch.includes(search);
          });
        }
        
        renderPaginatedStudents(filteredStudents);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allStudents.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        const search = searchInput && searchInput.value.trim().toLowerCase();
        let filteredStudents = allStudents;
        
        if (search) {
          filteredStudents = allStudents.filter(student => {
            const fullname = (student.fullname || '').toLowerCase();
            const email = (student.email || '').toLowerCase();
            const phone = (student.number || '').toString();
            const branch = (student.branch || '').toLowerCase();
            
            return fullname.includes(search) || 
                   email.includes(search) || 
                   phone.includes(search) || 
                   branch.includes(search);
          });
        }
        
        renderPaginatedStudents(filteredStudents);
      }
    });
  }


  // Initial load
  loadStudents();
});