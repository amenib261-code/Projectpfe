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
        <td>${s.phone || 'No phone'}</td>
        <td><span class="badge">${s.Level?.Niveaux || ''}</span></td>
        <td><span class="badge">${s.Classe?.name || ''}</span></td>
        <td><span class="badge">${s.Branch?.name || ''}</span></td>
        <td>
          <div class="actions">
            <button class="btn secondary" data-id="${s.id}">Edit</button>
            <button class="btn danger" data-id="${s.id}" data-name="${s.fullname || 'Student'}">Delete</button>
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
      if (cl) params.set('Class', `eq.${cl}`);
      
      // Try without any filters first to test basic connectivity
      let url = `${supabaseUrl}/rest/v1/student?select=*,Level:level_id("Niveaux"),Classe:classe_id(name),Branch:branch_id(name)`;
      if (cl) {
        url = `${supabaseUrl}/rest/v1/student?select=*,Level:level_id("Niveaux"),Classe:classe_id(name),Branch:branch_id(name)&Class=eq.${cl}`;
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
        const phone = (student.phone || '').toString();
        const branch = (student.Branch || '').toLowerCase();
        
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
              const phone = (student.phone || '').toString();
              const branch = (student.Branch || '').toLowerCase();
              
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


  // Test function to check form elements (call from console)
  window.testEditForm = function() {
    console.log('Testing edit form elements...');
    const elements = {
      fullname: document.getElementById('edit-fullname'),
      email: document.getElementById('edit-email'),
      phone: document.getElementById('edit-phone'),
      class: document.getElementById('edit-class'),
      branch: document.getElementById('edit-branch'),
      classId: document.getElementById('edit-class-id')
    };
    
    console.log('Form elements found:', elements);
    
    Object.keys(elements).forEach(key => {
      const el = elements[key];
      if (el) {
        console.log(`${key}:`, {
          element: el,
          value: el.value,
          type: el.type || el.tagName,
          id: el.id
        });
        } else {
        console.log(`${key}: NOT FOUND`);
      }
    });
  };

  // Simple add student function that works reliably
  window.simpleAddStudent = async function() {
    console.log('Simple add function called');
    
    // Get form values directly
    const fullname = document.getElementById('add-fullname')?.value;
    const email = document.getElementById('add-email')?.value;
    const phone = document.getElementById('add-phone')?.value;
    const levelId = document.getElementById('add-level')?.value;
    const classeId = document.getElementById('add-classe')?.value;
    const branchId = document.getElementById('add-branch')?.value;
    const selectedClassIds = Array.from(document.querySelectorAll('input[name="add-classes"]:checked')).map(cb => cb.value);
    
    console.log('Simple add - form values:', {
      fullname, email, phone, levelId, classeId, branchId, selectedClassIds
    });
    
    if (!fullname || !email || !levelId || !classeId) {
      alert('Full name, email, level, and class are required!');
            return;
        }
        
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Prepare student data
      const studentData = {
        fullname: fullname,
        email: email,
        level_id: parseInt(levelId),
        classe_id: parseInt(classeId)
      };
      
      // Add phone if provided
      if (phone) {
        studentData.phone = parseInt(phone);
      }
      
      // Add branch if provided
      if (branchId) {
        studentData.branch_id = parseInt(branchId);
      }
      
      // Add student
      const response = await fetch(`${supabaseUrl}/rest/v1/student`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      });
      
      if (response.ok) {
        const newStudent = await response.json();
        console.log('New student created:', newStudent);
        
        // Assign to selected classes
        if (selectedClassIds.length > 0) {
          for (const classId of selectedClassIds) {
            try {
              // Check if enrollment already exists (shouldn't happen for new students, but just in case)
              const exists = await checkEnrollmentExists(newStudent[0].id, classId);
              if (exists) {
                console.log(`Student already enrolled in class ${classId}, skipping`);
                continue;
              }
              
              const enrollmentResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents`, {
                method: 'POST',
                headers: {
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  student_id: newStudent[0].id,
                  class_id: parseInt(classId)
                })
              });
              
              if (!enrollmentResponse.ok) {
                const errorText = await enrollmentResponse.text();
                console.warn(`Failed to enroll student in class ${classId}:`, errorText);
                // Continue with other enrollments even if one fails
        } else {
                console.log(`Successfully enrolled student in class ${classId}`);
              }
            } catch (enrollmentError) {
              console.warn(`Error enrolling student in class ${classId}:`, enrollmentError);
              // Continue with other enrollments even if one fails
            }
          }
        }
        
        alert('Student added successfully!');
        document.querySelector('.universal-modal')?.remove();
        loadStudents();
        } else {
        const error = await response.text();
        console.error('Add student error:', error);
        if (response.status === 409) {
          alert(`Error: Email already exists for another student. Please use a different email address.`);
        } else {
          alert('Error adding student: ' + error);
        }
      }
    } catch (error) {
      console.error('Error adding student:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Error adding student: ' + error.message);
    }
  };

  // Simple edit function that works reliably
  window.simpleEditStudent = async function(studentId) {
    console.log('Simple edit function called for student:', studentId);
    
    // Get form values directly
    const fullname = document.getElementById('edit-fullname')?.value;
    const email = document.getElementById('edit-email')?.value;
    const phone = document.getElementById('edit-phone')?.value;
    const levelId = document.getElementById('edit-level')?.value;
    const classeId = document.getElementById('edit-classe')?.value;
    const branchId = document.getElementById('edit-branch')?.value;
    const selectedClassIds = Array.from(document.querySelectorAll('input[name="edit-classes"]:checked')).map(cb => cb.value);
    
    console.log('Simple edit student - form values:', {
      fullname, email, phone, levelId, classeId, branchId, selectedClassIds
    });
    
    if (!fullname || !email || !levelId || !classeId) {
      alert('Full name, email, level, and class are required!');
      return;
    }
    
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Update student
      const response = await fetch(`${supabaseUrl}/rest/v1/student?id=eq.${studentId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: fullname,
          email: email,
          level_id: parseInt(levelId),
          classe_id: parseInt(classeId),
          ...(phone && { phone: parseInt(phone) }),
          ...(branchId && { branch_id: parseInt(branchId) })
        })
      });
      
      if (response.ok) {
        // Update class enrollments
        // First, remove all existing enrollments for this student
        try {
          await fetch(`${supabaseUrl}/rest/v1/ClassStudents?student_id=eq.${studentId}`, {
            method: 'DELETE',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (deleteError) {
          console.warn('Error removing existing enrollments:', deleteError);
        }
        
        // Then add new enrollments
        if (selectedClassIds.length > 0) {
          for (const classId of selectedClassIds) {
            try {
              const enrollmentResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents`, {
                method: 'POST',
                headers: {
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  student_id: studentId,
                  class_id: parseInt(classId)
                })
              });
              
              if (!enrollmentResponse.ok) {
                const errorText = await enrollmentResponse.text();
                console.warn(`Failed to enroll student in class ${classId}:`, errorText);
                // Continue with other enrollments even if one fails
              }
            } catch (enrollmentError) {
              console.warn(`Error enrolling student in class ${classId}:`, enrollmentError);
              // Continue with other enrollments even if one fails
            }
          }
        }
        
        alert('Student updated successfully!');
        document.querySelector('.universal-modal')?.remove();
        loadStudents();
      } else {
        const error = await response.text();
        console.error('Update error:', error);
        if (response.status === 409) {
          alert(`Error: Email already exists for another student. Please use a different email address.`);
        } else {
          alert('Error updating student: ' + error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating student: ' + error.message);
    }
  };

  // Load reference tables
  async function loadLevels() {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Level?select=id,"Niveaux"&order=id`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      if (response.ok) {
        return await response.json();
        } else {
        console.error('Failed to load levels:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error loading levels:', error);
      return [];
    }
  }

  async function loadClasses() {
    try {
      console.log('Loading classes from database...');
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Classe?select=*&order=id`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      console.log('Classes response status:', response.status);
      
      if (response.ok) {
        const classes = await response.json();
        console.log('Classes loaded successfully:', classes);
        return classes;
    } else {
        console.error('Failed to load classes:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      return [];
    }
  }

  async function loadBranches() {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // TODO: Update this query once you provide the correct Branch table schema
      const response = await fetch(`${supabaseUrl}/rest/v1/Branch?select=*&order=id`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to load branches:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      return [];
    }
  }

  // Load Groupes Function (for class enrollments)
  async function loadGroupesForEnrollment() {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/Groupe?select=id,name,level_id,classe_id,branch_id,teacher_id,subject_id,Teacher:teacher_id(fullname),Subject:subject_id(subjects),Level:level_id("Niveaux"),Classe:classe_id(name),Branch:branch_id(name)`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch groupes:', response.status, response.statusText);
        throw new Error('Failed to fetch groupes');
      }
      
      const groupes = await response.json();
      console.log('Fetched groupes from database:', groupes);
      return groupes || [];
    } catch (error) {
      console.error('Error loading groupes:', error);
      return [];
    }
  }

  // Populate Class Dropdown
  function populateClassDropdown(selectId, selectedClassId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select Class (Optional)</option>';
    
    loadClasses().then(classes => {
      classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = `${cls.name} - ${cls.subject} (${cls.Teacher?.fullname || 'No Teacher'})`;
        if (selectedClassId && cls.id == selectedClassId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    });
  }

  // Check if enrollment already exists
  async function checkEnrollmentExists(studentId, classId) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?student_id=eq.${studentId}&class_id=eq.${classId}`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      if (response.ok) {
        const enrollments = await response.json();
        return enrollments.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  // Fetch Current Class Enrollments
  async function fetchCurrentClassEnrollments(studentId) {
    try {
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?student_id=eq.${studentId}&select=class_id`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      if (response.ok) {
        const enrollments = await response.json();
        return enrollments.map(e => e.class_id);
        } else {
        console.error('Failed to fetch class enrollments:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching class enrollments:', error);
      return [];
    }
  }

  // Populate reference table dropdowns
  async function populateReferenceDropdowns(prefix = 'add') {
    try {
      console.log(`Populating reference dropdowns with prefix: ${prefix}`);
      
      // Load all reference data
      const [levels, classes, branches] = await Promise.all([
        loadLevels(),
        loadClasses(),
        loadBranches()
      ]);
      
      console.log('Reference data loaded:', {
        levels: levels.length,
        classes: classes.length,
        branches: branches.length
      });

      // Populate Level dropdown
      const levelSelect = document.getElementById(`${prefix}-level`);
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
      const classeSelect = document.getElementById(`${prefix}-classe`);
      if (classeSelect) {
        console.log('Populating class dropdown...');
        classeSelect.innerHTML = '<option value="">Select Class</option>';
        if (classes.length > 0) {
          console.log('Adding classes to dropdown:', classes);
          classes.forEach(classe => {
            const option = document.createElement('option');
            option.value = classe.id;
            // Try different possible field names
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
        console.error(`Class dropdown element not found: ${prefix}-classe`);
      }

      // Populate Branch dropdown
      const branchSelect = document.getElementById(`${prefix}-branch`);
      if (branchSelect) {
        branchSelect.innerHTML = '<option value="">Select Branch (Optional)</option>';
        if (branches.length > 0) {
          branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch.id;
            // Try different possible field names
            const branchName = branch.name || branch.Nom || branch.Branch || `Branch ${branch.id}`;
            option.textContent = branchName;
            branchSelect.appendChild(option);
          });
        } else {
          branchSelect.innerHTML = '<option value="">No branches available</option>';
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

  // Populate Class Checkboxes with Smart Filtering
  function populateClassCheckboxes(containerId, selectedClassIds = [], studentLevelId = null, studentClasseId = null, studentBranchId = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }
    
    console.log('Populating class checkboxes with filters:', {
      containerId,
      selectedClassIds,
      studentLevelId,
      studentClasseId,
      studentBranchId
    });
    
    loadGroupesForEnrollment().then(groupes => {
      console.log('Loaded groupes for enrollment:', groupes);
      
      if (groupes.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #6c757d; font-style: italic;">No groups available</div>';
        return;
      }
      
      // Filter groups based on student's level, class, and branch
      let filteredGroupes = groupes;
      
      console.log('Original groupes count:', groupes.length);
      
      if (studentLevelId || studentClasseId || studentBranchId) {
        console.log('Applying filters:', { studentLevelId, studentClasseId, studentBranchId });
        
        filteredGroupes = groupes.filter(groupe => {
          console.log('Checking groupe:', {
            id: groupe.id,
            name: groupe.name,
            level_id: groupe.level_id,
            classe_id: groupe.classe_id,
            branch_id: groupe.branch_id
          });
          
          // Match level if specified
          if (studentLevelId && groupe.level_id !== parseInt(studentLevelId)) {
            console.log('Filtered out by level:', groupe.name);
            return false;
          }
          
          // Match class if specified
          if (studentClasseId && groupe.classe_id !== parseInt(studentClasseId)) {
            console.log('Filtered out by class:', groupe.name);
            return false;
          }
          
          // Match branch if specified (only if student has a branch)
          if (studentBranchId && groupe.branch_id && groupe.branch_id !== parseInt(studentBranchId)) {
            console.log('Filtered out by branch:', groupe.name);
            return false;
          }
          
          console.log('Group passed filters:', groupe.name);
          return true;
        });
      }
      
      console.log('Filtered groupes count:', filteredGroupes.length);
      
      if (filteredGroupes.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #6c757d; font-style: italic;">No groups available for your level/class/branch</div>';
        return;
      }
      
      container.innerHTML = '';
      filteredGroupes.forEach(groupe => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.cssText = 'display: flex; align-items: center; margin-bottom: 8px; padding: 8px; border-radius: 6px; background: white; border: 1px solid #e9ecef;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = containerId.includes('add') ? 'add-classes' : 'edit-classes';
        checkbox.value = groupe.id;
        checkbox.id = `${containerId}-${groupe.id}`;
        checkbox.style.marginRight = '12px';
        
        if (selectedClassIds.includes(groupe.id)) {
          checkbox.checked = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        // Create a more descriptive label with all the groupe information
        const levelName = groupe.Level?.Niveaux || 'Unknown Level';
        const classeName = groupe.Classe?.name || 'Unknown Class';
        const subjectName = groupe.Subject?.subjects || 'Unknown Subject';
        const teacherName = groupe.Teacher?.fullname || 'No Teacher';
        const branchName = groupe.Branch?.name ? ` - ${groupe.Branch.name}` : '';
        
        label.textContent = `${groupe.name} (${levelName} ${classeName} - ${subjectName}${branchName}) - ${teacherName}`;
        label.style.cssText = 'cursor: pointer; font-size: 14px; color: #333; flex: 1;';
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        container.appendChild(checkboxContainer);
      });
    });
  }

  // Add Student Modal Functions
  function openAddStudentModal() {
    const formContent = `
      <form id="add-student-form">
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
            <input type="tel" id="add-phone" name="phone" placeholder="e.g., 50123456" 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Level</label>
            <select id="add-level" name="level_id" required 
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
              <option value="">Select Level</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Class</label>
            <select id="add-classe" name="classe_id" required 
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
              <option value="">Select Class</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Branch</label>
            <select id="add-branch" name="branch_id" 
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
              <option value="">Select Branch (Optional)</option>
            </select>
          </div>
        </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500;"> Groupes  (Available)</label>
            <div id="add-classes-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #f8f9fa;">
              <div style="text-align: center; color: #6c757d; font-style: italic;">Loading classes...</div>
            </div>
          </div>
        
        <div id="add-student-message" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px;"></div>
      </form>
    `;

    createModal('Add New Student', formContent, [
      { 
        text: 'Cancel', 
        style: 'background: #6c757d; color: white;',
        onclick: () => document.querySelector('.universal-modal').remove()
      },
      { 
        text: 'Add Student', 
        style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
        onclick: () => {
          // Use the simple add function
          window.simpleAddStudent();
        }
      }
    ]);
    
    // Populate dropdowns after modal is created
    setTimeout(async () => {
      await populateReferenceDropdowns('add');
      populateClassCheckboxes('add-classes-container');
      
      // Add event listeners for smart filtering
      const levelSelect = document.getElementById('add-level');
      const classeSelect = document.getElementById('add-classe');
      const branchSelect = document.getElementById('add-branch');
      
      const updateClassCheckboxes = () => {
        const selectedLevelId = levelSelect?.value;
        const selectedClasseId = classeSelect?.value;
        const selectedBranchId = branchSelect?.value;
        
        console.log('Updating class checkboxes with filters:', {
          levelId: selectedLevelId,
          classeId: selectedClasseId,
          branchId: selectedBranchId
        });
        
        populateClassCheckboxes('add-classes-container', [], selectedLevelId, selectedClasseId, selectedBranchId);
      };
      
      if (levelSelect) {
        levelSelect.addEventListener('change', updateClassCheckboxes);
      }
      if (classeSelect) {
        classeSelect.addEventListener('change', updateClassCheckboxes);
      }
      if (branchSelect) {
        branchSelect.addEventListener('change', updateClassCheckboxes);
      }
    }, 100);
  }

  function showMessage(elementId, message, type = 'error') {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `modal-message ${type}`;
      messageEl.style.display = 'block';
    }
  }

  function hideMessage(elementId) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
      messageEl.style.display = 'none';
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const fullname = formData.get('fullname');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const userClass = formData.get('class');
    const branch = formData.get('branch');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation
    if (password !== confirmPassword) {
      showMessage('add-student-message', 'Passwords do not match', 'error');
            return;
        }
        
    if (password.length < 6) {
      showMessage('add-student-message', 'Password must be at least 6 characters', 'error');
            return;
        }
        
    try {
      showMessage('add-student-message', 'Adding student...', 'success');
      
      // Use service role key to add student directly to Users table
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // First, create the user in Supabase Auth
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          user_metadata: {
            fullname: fullname,
            phone: phone,
            userClass: userClass,
            userBranch: branch
          }
        })
      });
      
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.msg || 'Failed to create user account');
      }
      
      const authData = await authResponse.json();
      const userId = authData.user.id;
      
      // Then add to Users table
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/student`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: userId,
          fullname: fullname,
          email: email,
          phone: parseInt(phone),
          Class: userClass,
          Branch: branch
        })
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`Failed to add student: ${errorText}`);
      }
      
      showMessage('add-student-message', 'Student added successfully!', 'success');
      
      // Close modal and reload students after a short delay
    setTimeout(() => {
        closeAddStudentModal();
        loadStudents();
      }, 1500);
        
    } catch (error) {
      console.error('Add student error:', error);
      showMessage('add-student-message', `Error: ${error.message}`, 'error');
    }
  }

  // Modal Management Functions
  function openDeleteConfirmationModal(studentId, studentName) {
    console.log('Opening delete confirmation modal for:', studentName, 'ID:', studentId);
    const modal = document.getElementById('delete-confirmation-modal');
    const nameElement = document.getElementById('delete-student-name');
    
    console.log('Modal element:', modal);
    console.log('Name element:', nameElement);
    
    if (modal && nameElement) {
      nameElement.textContent = studentName;
      modal.classList.add('open');
      document.body.classList.add('modal-open');
      
      // Store student data for deletion
      modal.dataset.studentId = studentId;
      modal.dataset.studentName = studentName;
      
      console.log('Modal opened successfully');
            } else {
      console.error('Modal or name element not found');
    }
  }

  function closeDeleteConfirmationModal() {
    const modal = document.getElementById('delete-confirmation-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  }

  function showMessageModal(title, message, type = 'success') {
    console.log('showMessageModal called with:', title, message, type);
    const modal = document.getElementById('message-modal');
    const titleElement = document.getElementById('messageModalTitle');
    const textElement = document.getElementById('message-text');
    const iconElement = document.getElementById('message-icon');
    
    console.log('Modal elements found:', {
      modal: !!modal,
      titleElement: !!titleElement,
      textElement: !!textElement,
      iconElement: !!iconElement
    });
    
    if (modal && titleElement && textElement && iconElement) {
      titleElement.textContent = title;
      textElement.textContent = message;
      
      if (type === 'success') {
        iconElement.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i>';
      } else if (type === 'error') {
        iconElement.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #dc3545;"></i>';
        } else {
        iconElement.innerHTML = '<i class="fas fa-info-circle" style="color: #007bff;"></i>';
      }
      
      modal.classList.add('open');
      document.body.classList.add('modal-open');
      
      console.log('Modal classes after opening:', modal.className);
      console.log('Body classes after opening:', document.body.className);
        } else {
      console.error('Some modal elements not found');
    }
  }

  function closeMessageModal() {
    const modal = document.getElementById('message-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  }

  // Delete Student Function
  async function handleDeleteStudent(studentId, studentName) {
    const deleteContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">⚠️</div>
        <h4 style="margin: 0 0 8px; color: #333;">Are you sure?</h4>
        <p style="margin: 0; color: #666;">This action cannot be undone.</p>
      </div>
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; color: #856404; font-weight: 500;">
          You are about to delete student: <strong>${studentName}</strong>
        </p>
      </div>
      <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; color: #721c24; font-size: 14px;">
          This will permanently remove the student from the system, including their account and all associated data.
        </p>
      </div>
    `;

    createModal('Confirm Deletion', deleteContent, [
      { 
        text: 'Cancel', 
        style: 'background: #6c757d; color: white;',
        onclick: () => document.querySelector('.universal-modal').remove()
      },
      { 
        text: 'Delete Student', 
        style: 'background: linear-gradient(45deg, #dc3545, #c82333); color: white;',
        onclick: () => confirmDeleteStudent(studentId, studentName)
      }
    ]);
  }

  async function confirmDeleteStudent(studentId, studentName) {
    // Close the confirmation modal
    document.querySelector('.universal-modal').remove();
    
    try {
      // Use service role key to delete student
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Delete from Users table first
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/student?id=eq.${studentId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`Failed to delete student: ${errorText}`);
      }
      
      // Delete from Supabase Auth
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!authResponse.ok) {
        console.warn('Failed to delete from auth, but student was removed from Users table');
      }
      
      // Show success message
      createModal('Success', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #28a745; margin-bottom: 16px;">✅</div>
          <p style="margin: 0; font-size: 16px;">Student "${studentName}" has been deleted successfully!</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => {
            document.querySelector('.universal-modal').remove();
            loadStudents(); // Reload the student list
          }
        }
      ]);
      
    } catch (error) {
      console.error('Delete student error:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error deleting student: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: #dc3545; color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  }

  // Handle Add Student from Modal
  async function handleAddStudentFromModal() {
    const form = document.getElementById('add-student-form');
    
    // Debug: Check if form exists
    console.log('Add form element:', form);
    
    if (!form) {
      showMessage('add-student-message', 'Form not found', 'error');
      return;
    }
    
    // Use direct element access (FormData seems to have issues with dynamic forms)
    const fullname = document.getElementById('add-fullname')?.value;
    const email = document.getElementById('add-email')?.value;
    const phone = document.getElementById('add-phone')?.value;
    const userClass = document.getElementById('add-class')?.value;
    const branch = document.getElementById('add-branch')?.value;
    const classId = document.getElementById('add-class-id')?.value;
    
    // Debug logging
    console.log('Add form data (direct method):', {
      fullname, email, phone, userClass, branch, classId
    });
    
    // Validation
    if (!fullname || !email || !phone || !userClass || !branch) {
      showMessage('add-student-message', 'All fields are required', 'error');
      return;
    }
    
    try {
      showMessage('add-student-message', 'Adding student...', 'success');
      
      // Use service role key to add student directly to Users table
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Generate a random UUID for the student
      const userId = crypto.randomUUID();
      
      // Add to Users table
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/student`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: userId,
          fullname: fullname,
          email: email,
          phone: parseInt(phone),
          Class: userClass,
          Branch: branch
        })
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`Failed to add student: ${errorText}`);
      }
      
      // Assign student to class if classId is provided
      if (classId) {
        const classResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            class_id: parseInt(classId),
            student_id: userId
          })
        });
        
        if (!classResponse.ok) {
          console.warn('Failed to assign student to class, but student was created');
        }
      }
      
      // Show success message and close modal
      document.querySelector('.universal-modal').remove();
      
      createModal('Success', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #28a745; margin-bottom: 16px;">✅</div>
          <p style="margin: 0; font-size: 16px;">Student "${fullname}" has been added successfully!</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => {
            document.querySelector('.universal-modal').remove();
            loadStudents(); // Reload the student list
          }
        }
      ]);
      
    } catch (error) {
      console.error('Add student error:', error);
      showMessage('add-student-message', `Error: ${error.message}`, 'error');
    }
  }

  // Edit Student Modal Functions
  window.openEditStudentModal = async function(studentId, studentName) {
    try {
      // First, get the current student data
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/student?id=eq.${studentId}`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const students = await response.json();
      const student = students[0];
      
      console.log('Fetched student data:', student);
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      console.log('Student data for form:', student);
      console.log('Form will be created with values:', {
        fullname: student.fullname,
        email: student.email,
        phone: student.phone,
        Class: student.Class,
        Branch: student.Branch
      });
      
      // Debug: Check if student data exists
      if (!student.fullname || !student.email || !student.phone) {
        console.error('Missing student data:', {
          fullname: student.fullname,
          email: student.email,
          phone: student.phone,
          Class: student.Class,
          Branch: student.Branch
        });
      }
      
      const formContent = `
        <form id="edit-student-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Full Name</label>
              <input type="text" id="edit-fullname" name="fullname" placeholder="Enter full name" required 
                     value="${student.fullname || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Email Address</label>
              <input type="email" id="edit-email" name="email" placeholder="example@mail.com" required 
                     value="${student.email || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Phone Number</label>
              <input type="tel" id="edit-phone" name="phone" placeholder="e.g., 50123456" 
                     value="${student.phone || ''}"
                     style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Level</label>
              <select id="edit-level" name="level_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Level</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Class</label>
              <select id="edit-classe" name="classe_id" required 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Class</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500;">Branch</label>
              <select id="edit-branch" name="branch_id" 
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: 'Tajawal', sans-serif;">
                <option value="">Select Branch (Optional)</option>
              </select>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Select Classes (Multiple Selection)</label>
            <div id="edit-classes-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #f8f9fa;">
              <div style="text-align: center; color: #6c757d; font-style: italic;">Loading classes...</div>
            </div>
          </div>
          
          <div id="edit-student-message" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px;"></div>
        </form>
      `;

      createModal('Edit Student', formContent, [
        { 
          text: 'Cancel', 
          style: 'background: #6c757d; color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        },
        { 
          text: 'Save Changes', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => {
            // Use the simple edit function
            window.simpleEditStudent(studentId);
          }
        }
      ]);
      
      // Populate class dropdown and form fields after modal is created
      setTimeout(() => {
        // Debug: Check form field values after modal is created
        const fullnameEl = document.getElementById('edit-fullname');
        const emailEl = document.getElementById('edit-email');
        const phoneEl = document.getElementById('edit-phone');
        const classEl = document.getElementById('edit-class');
        const branchEl = document.getElementById('edit-branch');
        
        console.log('Form fields after modal creation (before manual population):', {
          fullname: fullnameEl?.value,
          email: emailEl?.value,
          phone: phoneEl?.value,
          class: classEl?.value,
          Branch: branchEl?.value
        });
        
        // Manual form population since value attributes are not working
        if (fullnameEl && student.fullname) {
          fullnameEl.value = student.fullname;
          console.log('Manually set fullname to:', student.fullname);
        }
        if (emailEl && student.email) {
          emailEl.value = student.email;
          console.log('Manually set email to:', student.email);
        }
        if (phoneEl && student.phone) {
          phoneEl.value = student.phone;
          console.log('Manually set phone to:', student.phone);
        }
        if (classEl && student.Class) {
          classEl.value = student.Class;
          console.log('Manually set class to:', student.Class);
        }
        if (branchEl && student.Branch) {
          branchEl.value = student.Branch;
          console.log('Manually set branch to:', student.Branch);
        }
        
        console.log('Form fields after manual population:', {
          fullname: fullnameEl?.value,
          email: emailEl?.value,
          phone: phoneEl?.value,
          class: classEl?.value,
          Branch: branchEl?.value
        });
        
        // Populate reference dropdowns and add smart filtering
        populateReferenceDropdowns('edit').then(() => {
          // Set the current student's values
          const levelSelect = document.getElementById('edit-level');
          const classeSelect = document.getElementById('edit-classe');
          const branchSelect = document.getElementById('edit-branch');
          
          if (levelSelect && student.level_id) {
            levelSelect.value = student.level_id;
          }
          if (classeSelect && student.classe_id) {
            classeSelect.value = student.classe_id;
          }
          if (branchSelect && student.branch_id) {
            branchSelect.value = student.branch_id;
          }
          
          // Add event listeners for smart filtering
          const updateClassCheckboxes = () => {
            const selectedLevelId = levelSelect?.value;
            const selectedClasseId = classeSelect?.value;
            const selectedBranchId = branchSelect?.value;
            
            console.log('Updating edit class checkboxes with filters:', {
              levelId: selectedLevelId,
              classeId: selectedClasseId,
              branchId: selectedBranchId
            });
            
            // Fetch current enrollments and populate with filtering
            fetchCurrentClassEnrollments(studentId).then(enrolledClassIds => {
              populateClassCheckboxes('edit-classes-container', enrolledClassIds, selectedLevelId, selectedClasseId, selectedBranchId);
            });
          };
          
          if (levelSelect) {
            levelSelect.addEventListener('change', updateClassCheckboxes);
          }
          if (classeSelect) {
            classeSelect.addEventListener('change', updateClassCheckboxes);
          }
          if (branchSelect) {
            branchSelect.addEventListener('change', updateClassCheckboxes);
          }
          
          // Initial population with current student's filters
          updateClassCheckboxes();
        });
      }, 200);
      
    } catch (error) {
      console.error('Error opening edit modal:', error);
      createModal('Error', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">❌</div>
          <p style="margin: 0; font-size: 16px;">Error loading student data: ${error.message}</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: #dc3545; color: white;',
          onclick: () => document.querySelector('.universal-modal').remove()
        }
      ]);
    }
  }

  // Handle Edit Student from Modal
  async function handleEditStudentFromModal(studentId) {
    const form = document.getElementById('edit-student-form');
    
    // Debug: Check if form exists
    console.log('Form element:', form);
    
    if (!form) {
      showMessage('edit-student-message', 'Form not found', 'error');
            return;
        }
        
    // Use direct element access (FormData seems to have issues with dynamic forms)
    const fullname = document.getElementById('edit-fullname')?.value;
    const email = document.getElementById('edit-email')?.value;
    const phone = document.getElementById('edit-phone')?.value;
    const userClass = document.getElementById('edit-class')?.value;
    const branch = document.getElementById('edit-branch')?.value;
    const classId = document.getElementById('edit-class-id')?.value;
    
    // Debug logging
    console.log('Edit form data (direct method):', {
      fullname, email, phone, userClass, branch, classId
    });
    
    // Additional debugging - check if elements exist and their current values
    console.log('Form elements at submission time:', {
      fullnameEl: document.getElementById('edit-fullname'),
      emailEl: document.getElementById('edit-email'),
      phoneEl: document.getElementById('edit-phone'),
      classEl: document.getElementById('edit-class'),
      branchEl: document.getElementById('edit-branch'),
      classIdEl: document.getElementById('edit-class-id')
    });
    
    console.log('Current element values:', {
      fullname: document.getElementById('edit-fullname')?.value,
      email: document.getElementById('edit-email')?.value,
      phone: document.getElementById('edit-phone')?.value,
      userClass: document.getElementById('edit-class')?.value,
      branch: document.getElementById('edit-branch')?.value,
      classId: document.getElementById('edit-class-id')?.value
    });
    
    // Validation
    if (!fullname || !email || !phone || !userClass || !branch) {
      showMessage('edit-student-message', 'All fields are required', 'error');
      return;
    }
    
    try {
      showMessage('edit-student-message', 'Updating student...', 'success');
      
      const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
      
      // Update Users table
      const updateData = {
        fullname: fullname,
        email: email,
        phone: parseInt(phone),
        Class: userClass,
        Branch: branch
      };
      
      console.log('Updating student with data:', updateData);
      
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/student?id=eq.${studentId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`Failed to update student: ${errorText}`);
      }
      
      // Handle class assignment
      // First, remove existing class assignments
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents?student_id=eq.${studentId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Then add new class assignment if classId is provided
      if (classId) {
        const classResponse = await fetch(`${supabaseUrl}/rest/v1/ClassStudents`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            class_id: parseInt(classId),
            student_id: studentId
          })
        });
        
        if (!classResponse.ok) {
          console.warn('Failed to assign student to class, but student data was updated');
        }
      }
      
      // Show success message and close modal
      document.querySelector('.universal-modal').remove();
      
      createModal('Success', `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #28a745; margin-bottom: 16px;">✅</div>
          <p style="margin: 0; font-size: 16px;">Student "${fullname}" has been updated successfully!</p>
        </div>
      `, [
        { 
          text: 'OK', 
          style: 'background: linear-gradient(45deg, #1a63ff, #4a90e2); color: white;',
          onclick: () => {
            document.querySelector('.universal-modal').remove();
            loadStudents(); // Reload the student list
          }
        }
      ]);
        
    } catch (error) {
      console.error('Edit student error:', error);
      showMessage('edit-student-message', `Error: ${error.message}`, 'error');
    }
  }

  // Event listeners
  if (filterClass) filterClass.addEventListener('change', loadStudents);
  if (searchInput) searchInput.addEventListener('input', filterAndRenderStudents);
  if (addBtn) addBtn.addEventListener('click', openAddStudentModal);
  
  // Add student form submission
  const addStudentForm = document.getElementById('add-student-form');
  if (addStudentForm) {
    addStudentForm.addEventListener('submit', handleAddStudent);
  }
  
  // Confirm delete button
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDeleteStudent);
  }
  
  // Add event delegation for Edit and Delete buttons
  if (list) {
    list.addEventListener('click', (e) => {
      console.log('Button clicked:', e.target.textContent, e.target);
      if (e.target.classList.contains('btn')) {
        const studentId = e.target.getAttribute('data-id');
        const studentName = e.target.getAttribute('data-name');
        
        console.log('Student ID:', studentId, 'Student Name:', studentName);
        
        if (e.target.textContent === 'Edit') {
          // Handle edit functionality
          console.log('Edit student:', studentId);
          openEditStudentModal(studentId, studentName);
        } else if (e.target.textContent === 'Delete') {
          console.log('Delete button clicked, calling handleDeleteStudent');
          handleDeleteStudent(studentId, studentName);
        }
      }
    });
  }
  
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
            const phone = (student.phone || '').toString();
            const branch = (student.Branch || '').toLowerCase();
            
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
            const phone = (student.phone || '').toString();
            const branch = (student.Branch || '').toLowerCase();
            
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


  // Universal Modal System
  function createModal(title, content, buttons = []) {
    // Remove any existing modals
    const existingModals = document.querySelectorAll('.universal-modal');
    existingModals.forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'universal-modal';
    modal.style.cssText = `
        position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
        font-family: 'Tajawal', sans-serif;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 20px 0 20px;
      border-bottom: 1px solid #eee;
      margin-bottom: 20px;
    `;
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 18px; color: #333;">${title}</h3>
        <button onclick="this.closest('.universal-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
      </div>
    `;
    
    // Body
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 0 20px 20px 20px;
    `;
    body.innerHTML = content;
    
    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 20px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    `;
    
    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-family: 'Tajawal', sans-serif;
        ${button.style || 'background: #007bff; color: white;'}
      `;
      btn.onclick = button.onclick;
      footer.appendChild(btn);
    });
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    return modal;
  }

  // Test function for debugging
  window.testModal = function() {
    createModal('Test Modal', '<p>This is a test modal to check if modals work!</p>', [
      { text: 'Close', onclick: () => document.querySelector('.universal-modal').remove() }
    ]);
  };

  // Test Students button
  const testStudentsBtn = document.getElementById('test-students-btn');
  if (testStudentsBtn) {
    testStudentsBtn.addEventListener('click', async () => {
      console.log('Test Students button clicked');
      try {
        const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
        
        console.log('Testing student table connection...');
        const response = await fetch(`${supabaseUrl}/rest/v1/student?select=*`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('Student table response status:', response.status);
        const data = await response.json();
        console.log('Student table response data:', data);
        
        if (response.ok) {
          alert(`Student table connection successful!\n\nFound ${data.length} students in the database.\n\nTable: student\nFields: fullname, email, phone, Class, Branch`);
        } else {
          alert(`Student table connection failed!\n\nStatus: ${response.status}\nError: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        console.error('Test students failed:', error);
        alert(`Test students failed: ${error.message}`);
      }
    });
  }

  // Test Groups button
  const testGroupsBtn = document.getElementById('test-groups-btn');
  if (testGroupsBtn) {
    testGroupsBtn.addEventListener('click', async () => {
      console.log('Test Groups button clicked');
      try {
        const supabaseUrl = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o';
        
        console.log('Testing Groupe table connection...');
        const response = await fetch(`${supabaseUrl}/rest/v1/Groupe?select=id,name,level_id,classe_id,branch_id,teacher_id,subject_id,Teacher:teacher_id(fullname),Subject:subject_id(subjects),Level:level_id("Niveaux"),Classe:classe_id(name),Branch:branch_id(name)`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('Groupe table response status:', response.status);
        const data = await response.json();
        console.log('Groupe table response data:', data);
        
        if (response.ok) {
          alert(`Groupe table connection successful!\n\nFound ${data.length} groups in the database.\n\nTable: Groupe\nFields: id, name, level_id, classe_id, branch_id, teacher_id, subject_id`);
        } else {
          alert(`Groupe table connection failed!\n\nStatus: ${response.status}\nError: ${JSON.stringify(data)}`);
        }
        
        // Test loadGroupesForEnrollment function
        console.log('Testing loadGroupesForEnrollment function...');
        const testGroupes = await loadGroupesForEnrollment();
        console.log('loadGroupesForEnrollment result:', testGroupes);
        
      } catch (error) {
        console.error('Test groups failed:', error);
        alert(`Test groups failed: ${error.message}`);
      }
    });
  }

  // Initial load
  loadStudents();
});