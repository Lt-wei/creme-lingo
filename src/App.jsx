import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';
import ReviewPage from './pages/ReviewPage'; // 新增

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/review" element={<ReviewPage />} /> {/* 新增 */}
      </Routes>
    </Router>
  );
}

export default App;