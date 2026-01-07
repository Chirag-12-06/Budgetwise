// User identification utility
// Uses authenticated user ID if logged in, otherwise generates anonymous ID

function getUserId() {
  // First check if user is logged in
  const user = localStorage.getItem('bw-user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.id;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Fallback to anonymous user ID
  let userId = localStorage.getItem('bw-user-id');
  
  if (!userId) {
    // Generate a unique anonymous user ID
    userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bw-user-id', userId);
    console.log('Anonymous user ID created:', userId);
  }
  
  return userId;
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem('bw-token');
}

// Get user name
function getUserName() {
  const user = localStorage.getItem('bw-user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.name;
    } catch (e) {
      return 'Guest';
    }
  }
  return 'Guest';
}

// Logout function
function logout() {
  localStorage.removeItem('bw-user');
  localStorage.removeItem('bw-token');
  // Keep bw-user-id for anonymous usage
  window.location.href = 'auth.html';
}

// Export for use in other files
window.getUserId = getUserId;
window.isAuthenticated = isAuthenticated;
window.getUserName = getUserName;
window.logout = logout;
