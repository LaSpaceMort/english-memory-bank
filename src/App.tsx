import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import SourcesPage from './pages/SourcesPage'
import SourceDetailPage from './pages/SourceDetailPage'
import SourceFormPage from './pages/SourceFormPage'
import UnitFormPage from './pages/UnitFormPage'
import UploadWizardPage from './pages/UploadWizardPage'
import BackupPage from './pages/BackupPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/sources/new" element={<SourceFormPage mode="new" />} />
          <Route path="/sources/:sourceId/edit" element={<SourceFormPage mode="edit" />} />
          <Route path="/sources/:sourceId" element={<SourceDetailPage />} />
          <Route path="/units/new" element={<UnitFormPage mode="new" />} />
          <Route path="/units/:unitId/edit" element={<UnitFormPage mode="edit" />} />
          <Route path="/upload" element={<UploadWizardPage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
