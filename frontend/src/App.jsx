import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CreateDocument from "./pages/CreateDocument.jsx";

function App() {
  return (
    <Routes>
      {/* Route for our PDF generator form */}
      <Route path="/create" element={<CreateDocument />} />
      
      {/* Redirect any stray traffic straight to the creation page */}
      <Route path="*" element={<Navigate to="/create" replace />} />
    </Routes>
  );
}

export default App;