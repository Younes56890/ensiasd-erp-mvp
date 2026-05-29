// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
 <Route path="/" element={<LoginPage />} />
<Route path="/students/:studentId" element={<StudentDashboard />} />
  <Route path="/teachers/:teacherId" element={<TeacherDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}
