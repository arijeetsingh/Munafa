import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './lib/store.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import Today from './pages/Today.jsx';
import Insights from './pages/Insights.jsx';
import Entries from './pages/Entries.jsx';
import Settings from './pages/Settings.jsx';
import Metrics from './pages/Metrics.jsx';

export default function App() {
  const { vendor, booting, t } = useApp();

  if (booting) {
    return <div className="boot" role="status"><span className="spinner" />{t('loading')}</div>;
  }
  if (!vendor) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  if (!vendor.onboarded) return <Onboarding />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="hisaab" element={<Today />} />
        <Route path="insights" element={<Insights />} />
        <Route path="khata" element={<Entries />} />
        <Route path="settings" element={<Settings />} />
        <Route path="metrics" element={<Metrics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
