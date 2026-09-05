
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

import { OverviewPage } from './pages/OverviewPage';
import { EngineHealthPage } from './pages/EngineHealthPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { FaultAnalysisPage } from './pages/FaultAnalysisPage';
import { RULPredictionPage } from './pages/RULPredictionPage';
import { MissionReliabilityPage } from './pages/MissionReliabilityPage';
import { HistoricalDataPage } from './pages/HistoricalDataPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/engine-health" element={<EngineHealthPage />} />
        <Route path="/digital-twin" element={<DigitalTwinPage />} />
        <Route path="/telemetry" element={<TelemetryPage />} />
        <Route path="/fault-analysis" element={<FaultAnalysisPage />} />
        <Route path="/rul-prediction" element={<RULPredictionPage />} />
        <Route path="/mission-reliability" element={<MissionReliabilityPage />} />
        <Route path="/historical-data" element={<HistoricalDataPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Catch-all route to prevent blank pages on unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
