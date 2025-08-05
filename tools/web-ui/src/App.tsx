import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import Documents from './pages/Documents';
import Sprints from './pages/Sprints';
import SprintDetails from './pages/SprintDetails';
import Layout from './components/layout/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskBoard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/sprints" element={<Sprints />} />
        <Route path="/sprints/:id" element={<SprintDetails />} />
      </Routes>
    </Layout>
  );
}

export default App;