import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/components/dashboard/Dashboard'
import WorkspaceView from '@/components/workspace/WorkspaceView'
import ToolView from '@/components/tool/ToolView'
import { PerformanceOptimizationDemo } from '@/components/performance/PerformanceOptimizationDemo'
import '@/styles/globals.css'

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/performance" element={<PerformanceOptimizationDemo />} />
          <Route path="/workspace/:workspaceType/:workspaceId" element={<WorkspaceView />} />
          <Route path="/workspace/:workspaceType/:workspaceId/tool/:toolId" element={<ToolView />} />
        </Routes>
      </AppLayout>
    </Router>
  )
}

export default App