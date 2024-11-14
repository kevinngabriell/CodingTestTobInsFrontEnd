import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './page/home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Export App as default and formatDate as a named export
export default App;
export { formatDate };