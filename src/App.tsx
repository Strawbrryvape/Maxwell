import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import SearchResults from '@/pages/SearchResults'
import DocumentDetail from '@/pages/DocumentDetail'
import IdentityVault from '@/components/IdentityVault'
import { AutoIngestHub } from '@/components/AutoIngestHub'
import { InsightEngine } from '@/components/InsightEngine'
import { VoiceMemos } from '@/components/VoiceMemos'
import { AuthGuard } from '@/components/AuthGuard'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={
          <AuthGuard>
            <Home />
          </AuthGuard>
        } />
        <Route path="/document/:id" element={
          <AuthGuard>
            <DocumentDetail />
          </AuthGuard>
        } />
        <Route path="/search" element={
          <AuthGuard>
            <SearchResults />
          </AuthGuard>
        } />
        <Route path="/identity" element={
          <AuthGuard>
            <IdentityVault />
          </AuthGuard>
        } />
        <Route path="/auto-ingest" element={
          <AuthGuard>
            <AutoIngestHub />
          </AuthGuard>
        } />
        <Route path="/insights" element={
          <AuthGuard>
            <InsightEngine />
          </AuthGuard>
        } />
        <Route path="/voice" element={
          <AuthGuard>
            <VoiceMemos />
          </AuthGuard>
        } />
      </Route>
    </Routes>
  )
}
