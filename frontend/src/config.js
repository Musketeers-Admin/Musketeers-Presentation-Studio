// In development: set REACT_APP_API_URL=http://localhost:3001 in .env.development
// In production (Railway): leave unset — Express serves everything from the same origin
const API_BASE = process.env.REACT_APP_API_URL || '';
export default API_BASE;
