import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './constants/routes'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import MaterialPage from './pages/MaterialPage'
import StudyPage from './pages/StudyPage'
import ArchivePage from './pages/ArchivePage'
import ReviewPage from './pages/ReviewPage'
import OutputPage from './pages/OutputPage'
import SettingsPage from './pages/SettingsPage'
import CaseAnalysisPage from './pages/CaseAnalysisPage'
import GraphPage from './features/graph/GraphPage'
import LevelStudyPage from './features/level/LevelStudyPage'
import OnboardingGuide from './components/ui/OnboardingGuide'
import AdminPage from './features/admin/AdminPage'
import MetaConceptsPage from './features/meta/MetaConceptsPage'
import DeconstructorPage from './features/meta/DeconstructorPage'
import BookDeconstructorPage from './features/meta/BookDeconstructorPage'
import DomainTermsPage from './features/meta/DomainTermsPage'
import MECETrainerPage from './features/meta/MECETrainerPage'
import MentalModelsPage from './features/meta/MentalModelsPage'
import TranslationPracticePage from './features/meta/TranslationPracticePage'
import VaultPage from './pages/VaultPage'

function App(): JSX.Element {
  return (
    <>
      <OnboardingGuide />
      <Routes>
        <Route path={ROUTES.HOME} element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTES.MATERIALS} element={<MaterialPage />} />
          <Route path={ROUTES.STUDY} element={<StudyPage />} />
          <Route path={ROUTES.ARCHIVE} element={<ArchivePage />} />
          <Route path={ROUTES.REVIEW} element={<ReviewPage />} />
          <Route path={ROUTES.OUTPUT} element={<OutputPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.GRAPH} element={<GraphPage />} />
          <Route path={ROUTES.LEVEL} element={<LevelStudyPage />} />
          <Route path={ROUTES.CASE_ANALYSIS} element={<CaseAnalysisPage />} />
          <Route path={ROUTES.META_CONCEPTS} element={<MetaConceptsPage />} />
          <Route path={ROUTES.DECONSTRUCTOR} element={<DeconstructorPage />} />
          <Route path={ROUTES.BOOK_DECONSTRUCTOR} element={<BookDeconstructorPage />} />
          <Route path={ROUTES.DOMAIN_TERMS} element={<DomainTermsPage />} />
          <Route path={ROUTES.MECE_TRAINER} element={<MECETrainerPage />} />
          <Route path={ROUTES.MENTAL_MODELS} element={<MentalModelsPage />} />
          <Route path={ROUTES.TRANSLATION_PRACTICE} element={<TranslationPracticePage />} />
          <Route path={ROUTES.VAULT} element={<VaultPage />} />
          <Route path={ROUTES.ADMIN} element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </>
  )
}

export default App
