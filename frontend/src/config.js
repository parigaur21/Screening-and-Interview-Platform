const getApiUrl = () => {
  // If Vite's dev server is used (usually running on a dev port like 3000, 5173, etc. while backend is on 5000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port) {
    // If the frontend and backend are on different ports, point to port 5000
    if (window.location.port !== '5000') {
      return `http://${window.location.hostname}:5000/api`;
    }
  }
  // Otherwise, use relative path (production reverse-proxy setup)
  return '/api';
};

export const API_BASE_URL = getApiUrl();
