import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const studentName = localStorage.getItem('user_name') || 'Student';
  
  const [profile, setProfile] = useState(null);
  const [tests, setTests] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch in parallel
        const [profileRes, testsRes, modulesRes, progressRes] = await Promise.all([
          fetch(`${API_URL}/api/student/profile`, { headers }),
          fetch(`${API_URL}/api/student/tests`, { headers }),
          fetch(`${API_URL}/api/student/my-modules`, { headers }),
          fetch(`${API_URL}/api/student/progress`, { headers })
        ]);

        if (profileRes.ok) setProfile(await profileRes.json());
        if (testsRes.ok) setTests(await testsRes.json());
        if (modulesRes.ok) setModules(await modulesRes.json());
        if (progressRes.ok) setProgress(await progressRes.json());
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboardData();
  }, [token]);

  // Get upcoming tests (pending, not overdue)
  const upcomingTests = tests.filter(t => 
    t.completion_status === 'pending' && !t.is_overdue
  ).slice(0, 3);

  // Get recent modules
  const recentModules = modules.slice(0, 4);

  // Get recent completed tests
  const completedTests = tests.filter(t => t.completion_status === 'completed').slice(0, 3);

  // Calculate days until deadline
  const getDaysUntil = (deadline) => {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const sidebarItems = [
    { title: 'Dashboard', route: '/dashboard', icon: '🏠' },
    { title: 'Learning Modules', route: '/courses', icon: '📚' },
    { title: 'Test Knowledge', route: '/test', icon: '📝' },
    { title: 'Progress Tracker', route: '/progress', icon: '📊' },
    { title: 'My Profile', route: '/profile', icon: '👤' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd]">
        <div className="animate-spin h-10 w-10 border-3 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fdfdfd] font-sans text-slate-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-6 fixed h-screen">
        <div className="mb-8 px-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-slate-700">Classroom</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          {sidebarItems.map((item) => (
            <button 
              key={item.title}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-all ${
                item.route === '/dashboard' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout} 
          className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 font-medium transition-all"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {profile?.name?.split(' ')[0] || studentName}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              {profile?.class_dept} {profile?.section} • Here's your learning overview
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold cursor-pointer hover:bg-emerald-200 transition-colors"
            >
              {profile?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Modules</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{progress?.total_modules || modules.length}</p>
            <p className="text-sm text-slate-500">Available to learn</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tests</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{progress?.tests_completed || 0}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Avg Score</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {progress?.average_score ? `${Math.round(progress.average_score)}%` : '--'}
            </p>
            <p className="text-sm text-slate-500">On tests</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{upcomingTests.length}</p>
            <p className="text-sm text-slate-500">Tests to take</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Upcoming Tests & Modules */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upcoming Tests */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800">Upcoming Tests</h2>
                <button 
                  onClick={() => navigate('/test')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View all →
                </button>
              </div>
              
              {upcomingTests.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <span className="text-4xl">🎉</span>
                  <p className="mt-2">No pending tests! You're all caught up.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingTests.map((test) => (
                    <div key={test.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <span className="text-amber-600 font-bold">{test.total_questions}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{test.title}</p>
                          <p className="text-sm text-slate-500">{test.teacher_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          getDaysUntil(test.deadline) === 'Today' || getDaysUntil(test.deadline) === 'Tomorrow'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {getDaysUntil(test.deadline)}
                        </span>
                        <button 
                          onClick={() => navigate('/test')}
                          className="block mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Take test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Modules */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800">Learning Modules</h2>
                <button 
                  onClick={() => navigate('/courses')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View all →
                </button>
              </div>
              
              {recentModules.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <span className="text-4xl">📚</span>
                  <p className="mt-2">No modules published yet</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => navigate(`/learning/${module.id}`)}
                      className="p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl text-left transition-colors group"
                    >
                      <p className="font-medium text-slate-800 group-hover:text-emerald-700 line-clamp-1">
                        {module.topic_title}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        <span>{module.step_count} steps</span>
                        <span>•</span>
                        <span>{module.teacher_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Performance & Quick Actions */}
          <div className="space-y-6">
            
            {/* Recent Performance */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Recent Results</h2>
              </div>
              
              {completedTests.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <span className="text-3xl">📊</span>
                  <p className="mt-2 text-sm">No completed tests yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {completedTests.map((test) => (
                    <div key={test.id} className="px-5 py-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 truncate flex-1 mr-2">
                        {test.title}
                      </p>
                      <span className={`text-sm font-bold ${
                        test.percentage >= 70 ? 'text-emerald-600' : 
                        test.percentage >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {test.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => navigate('/progress')}
                  className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View full progress →
                </button>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
              <h2 className="font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/courses')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors flex items-center gap-3"
                >
                  <span>📚</span>
                  <span className="text-sm font-medium">Continue Learning</span>
                </button>
                <button 
                  onClick={() => navigate('/test')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors flex items-center gap-3"
                >
                  <span>📝</span>
                  <span className="text-sm font-medium">Take a Test</span>
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors flex items-center gap-3"
                >
                  <span>👤</span>
                  <span className="text-sm font-medium">Update Profile</span>
                </button>
              </div>
            </section>

            {/* Motivational */}
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-sm text-blue-800 italic">
                "The expert in anything was once a beginner."
              </p>
              <p className="text-xs text-blue-600 mt-2">— Helen Hayes</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-xs text-slate-400 text-center">
          SUSTAINABLE CLASSROOM • 2026
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;