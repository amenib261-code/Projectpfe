// Database Configuration
// IMPORTANT: In production, these should be environment variables
// For frontend applications, consider using a backend API instead

const CONFIG = {
    SUPABASE_URL: 'https://lzlqxwwhjveyfhgopdph.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjY5NTYsImV4cCI6MjA2NTE0Mjk1Nn0.VFzjDx1WSS03cM97vKHZAAR8vdheRtKC9wPBEoSQBxY',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2Njk1NiwiZXhwIjoyMDY1MTQyOTU2fQ.EWppid-jEsiHdJZXWf6r-ArFVEFR8KxVqeEBSxVfY7o',
    
    // Database table names
    TABLES: {
        STUDENTS: 'student',      // New students table with foreign keys
        USERS: 'Users',           // Old students table (deprecated)
        TEACHERS: 'Teacher',      // Teachers table
        GROUPES: 'Groupe',        // New Groupe table (replaces Classes)
        CLASSES: 'Classes',       // Old Classes table (deprecated)
        CLASS_STUDENTS: 'ClassStudents',  // Class-student relationships table
        LEVELS: 'Level',          // Level reference table
        CLASSES_REF: 'Classe',    // Classe reference table
        BRANCHES: 'Branch',       // Branch reference table
        SUBJECTS: 'Subjects'      // Subject reference table
    }
};

// Make config available globally
window.CONFIG = CONFIG;
