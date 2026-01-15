import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const sidebarItems = [
    { title: 'Learning Modules', route: '/courses' },
    { title: 'Progress Tracker', route: '/progress' },
    { title: 'Test Knowledge', route: '/test' },
    { title: 'Student Profile', route: '/profile' },
  ];

  return (
    <div className="min-h-screen flex bg-[#fdfdfd] font-sans text-slate-800">
      
      {/* 1. SIMPLE SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-6">
        <div className="mb-10 px-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-slate-700">Classroom</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          {sidebarItems.map((item) => (
            <button 
              key={item.title}
              onClick={() => navigate(item.route)}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all"
            >
              <span className="text-lg">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => navigate('/')} 
          className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 font-medium transition-all"
        >
          <span>Logout</span>
        </button>
      </aside>

      {/* 2. MAIN AREA: Focusing on the Idea */}
      <main className="flex-1 p-12 max-w-5xl">
        
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to your space.</h1>
          <p className="text-slate-500 mt-2">Sustainable learning designed for your growth and wellbeing.</p>
        </header>

        {/* PLATFORM MISSION SECTION */}
        <section className="space-y-12">
          
          {/* Concept 1: The Vision */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-4">The Vision</h2>
            <p className="text-xl leading-relaxed text-slate-700">
              This platform is a <span className="font-bold border-b-2 border-emerald-200">Sustainable Classroom</span>. 
              Our goal is to provide students across Africa with high-quality technical education that fits into a healthy lifestyle. 
              We don't just teach code; we support the person writing it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Concept 2: Why Sustainability? */}
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-3">Why Sustainable?</h3>
              <p className="text-sm text-emerald-700/80 leading-relaxed">
                Sustainability in education means learning at a pace that prevents burnout. We integrate "wellbeing checkpoints" 
                to ensure your mental health is as strong as your coding skills.
              </p>
            </div>

            {/* Concept 3: Education for All */}
            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-3">Accessible & Open</h3>
              <p className="text-sm text-blue-700/80 leading-relaxed">
                Whether you are learning via text, video, or our interactive workbench, the classroom is optimized for 
                low-bandwidth areas to ensure every student in Africa can participate.
              </p>
            </div>
          </div>

          {/* Concept 4: The Workflow */}
          <div className="pt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">How it works</h2>
            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-1 flex gap-4">
                  <div className="font-bold text-emerald-500">01.</div>
                  <p className="text-sm text-slate-600">Complete modules through videos or interactive text.</p>
               </div>
               <div className="flex-1 flex gap-4">
                  <div className="font-bold text-emerald-500">02.</div>
                  <p className="text-sm text-slate-600">Apply logic in the safe, browser-based Coding Workbench.</p>
               </div>
               <div className="flex-1 flex gap-4">
                  <div className="font-bold text-emerald-500">03.</div>
                  <p className="text-sm text-slate-600">Track your progress and wellbeing score daily.</p>
               </div>
            </div>
          </div>

        </section>

        <footer className="mt-20 text-xs text-slate-300 font-medium">
          SUSTAINABLE CLASSROOM INITIATIVE • 2026
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;