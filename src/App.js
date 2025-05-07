import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage'; 
import ScheduleDashboard from './ScheduleDashboard'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/schedule" element={<ScheduleDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;