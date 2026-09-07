"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Image from 'next/image';

const courseColors = [
  { from: '#7c3aed', to: '#2563eb', glow: 'rgba(124,58,237,0.4)', icon: '🧮' },
  { from: '#059669', to: '#0891b2', glow: 'rgba(5,150,105,0.4)', icon: '🗄️' },
  { from: '#dc2626', to: '#ea580c', glow: 'rgba(220,38,38,0.4)', icon: '🌐' },
  { from: '#9333ea', to: '#ec4899', glow: 'rgba(147,51,234,0.4)', icon: '🤖' },
  { from: '#ca8a04', to: '#16a34a', glow: 'rgba(202,138,4,0.4)', icon: '📡' },
  { from: '#0284c7', to: '#7c3aed', glow: 'rgba(2,132,199,0.4)', icon: '📊' },
];

export default function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  
  // Create Course Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Report Modal State
  const [reportCourse, setReportCourse] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    // Fetch courses
    fetch(`${getApiBase()}/courses/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { router.push('/login'); return; }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch user profile
    fetch(`${getApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(console.error);
  }, [router]);

  const startSession = async (courseId: number) => {
    setStarting(courseId);
    const token = localStorage.getItem('token');
    const res = await fetch(`${getApiBase()}/attendance/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ course_id: courseId, duration_minutes: 2 })
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/session/${data.id}?token=${data.qr_token}`);
    } else {
      alert('Failed to start session');
      setStarting(null);
    }
  };

  const viewReport = async (course: any) => {
    setReportCourse(course);
    setReportLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${getApiBase()}/attendance/report/${course.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${getApiBase()}/courses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCourseName, code: newCourseCode })
      });
      if (res.ok) {
        const newCourse = await res.json();
        setCourses([...courses, newCourse]);
        setShowCreateModal(false);
        setNewCourseName('');
        setNewCourseCode('');
      } else {
        alert('Failed to create course');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (!confirm(`Are you sure you want to delete ${courseName}? This will permanently remove all attendance records for this course.`)) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${getApiBase()}/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
      } else {
        alert('Failed to delete course');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while deleting course');
    }
  };

  // Calculate dynamic stats
  const totalCourses = courses.length;
  // For now, mock other stats as we don't have a /stats endpoint
  const totalStudents = reportData ? reportData.report.length : (courses.length > 0 ? 1 : 0);
  const sessionsRun = reportData && reportData.report.length > 0 ? reportData.report[0].total_sessions : 0;

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      {/* Animated background orbs */}
      <div className="fixed w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{background: 'radial-gradient(circle, #7c3aed, transparent)', top: '10%', right: '5%', animation: 'pulse 4s ease-in-out infinite'}} />
      <div className="fixed w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{background: 'radial-gradient(circle, #2563eb, transparent)', bottom: '10%', left: '5%', animation: 'pulse 6s ease-in-out infinite'}} />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
        style={{background: 'rgba(15,12,41,0.8)'}}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white overflow-hidden"
              style={{boxShadow: '0 0 20px rgba(124,58,237,0.5)'}}>
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="UET Peshawar"
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-xl font-black text-white" style={{fontFamily: 'var(--font-poppins)'}}>
              UET Peshawar
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-white leading-tight">{user.full_name}</span>
                <span className="text-xs text-violet-400 font-medium">{user.email}</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10"
              style={{background: 'rgba(255,255,255,0.05)'}}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-300 font-medium">Teacher Portal</span>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-all"
              style={{background: 'rgba(255,255,255,0.05)'}}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-violet-400 font-semibold text-sm uppercase tracking-widest mb-2">Dashboard Overview</p>
            <h1 className="text-5xl font-black text-white leading-tight" style={{fontFamily: 'var(--font-poppins)'}}>
              Your Courses 🎓
            </h1>
            <p className="text-gray-400 mt-2">Click "Start Session" to generate a live QR code, or view real-time reports.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-2"
            style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.4)'}}>
            <span className="text-lg">+</span> New Course
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Courses', value: totalCourses, icon: '📚', color: '#7c3aed' },
            { label: 'Active Today', value: sessionsRun > 0 ? 1 : 0, icon: '✅', color: '#059669' },
            { label: 'Enrolled Students', value: totalStudents, icon: '👥', color: '#2563eb' },
            { label: 'Sessions Run', value: sessionsRun, icon: '📡', color: '#ec4899' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-5 border border-white/10 backdrop-blur-sm"
              style={{background: 'rgba(255,255,255,0.04)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-black text-white" style={{fontFamily: 'var(--font-poppins)'}}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 animate-spin flex items-center justify-center"
                style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)'}}>
                <div className="w-12 h-12 rounded-xl" style={{background: '#0f0c29'}} />
              </div>
              <p className="text-gray-400 text-sm">Loading your courses...</p>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-white mb-2">No courses yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first course to start taking attendance!</p>
            <button onClick={() => setShowCreateModal(true)}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
              style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.4)'}}>
              + Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course, i) => {
              const color = courseColors[i % courseColors.length];
              return (
                <div key={course.id}
                  className="group relative rounded-3xl p-6 border border-white/10 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(20px)'
                  }}>
                  
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{boxShadow: `0 0 40px ${color.glow}`}} />

                  {/* Top accent bar */}
                  <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
                    style={{background: `linear-gradient(90deg, ${color.from}, ${color.to})`}} />

                  {/* Icon badge */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                    style={{
                      background: `linear-gradient(135deg, ${color.from}33, ${color.to}33)`,
                      border: `1px solid ${color.from}44`,
                      boxShadow: `0 0 20px ${color.glow}`
                    }}>
                    {color.icon}
                  </div>

                  {/* Course info */}
                  <div className="mb-5">
                    <div className="inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-2"
                      style={{
                        background: `linear-gradient(135deg, ${color.from}22, ${color.to}22)`,
                        color: color.from,
                        border: `1px solid ${color.from}44`
                      }}>
                      {course.code}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug" style={{fontFamily: 'var(--font-poppins)'}}>
                      {course.name}
                    </h3>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => startSession(course.id)}
                      disabled={starting === course.id}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                        boxShadow: `0 0 20px ${color.glow}`,
                        fontFamily: 'var(--font-poppins)'
                      }}>
                      {starting === course.id ? '⏳ Starting...' : '📡 Start Session'}
                    </button>
                    <button 
                      onClick={() => viewReport(course)}
                      className="px-4 py-2.5 rounded-xl text-gray-400 border border-white/10 hover:border-violet-500/50 hover:text-white transition-all hover:bg-violet-500/10"
                      style={{background: 'rgba(255,255,255,0.04)'}}
                      title="View Attendance Report"
                    >
                      📊
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(course.id, course.name)}
                      className="px-4 py-2.5 rounded-xl text-gray-400 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-all hover:bg-red-500/10"
                      style={{background: 'rgba(255,255,255,0.04)'}}
                      title="Delete Course"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Report Modal */}
      {reportCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="relative w-full max-w-2xl rounded-3xl p-6 border border-white/10 max-h-[80vh] flex flex-col"
            style={{ background: "rgba(15,12,41,0.95)", boxShadow: "0 0 60px rgba(124,58,237,0.2), 0 25px 50px rgba(0,0,0,0.8)" }}>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  📊 Attendance Report
                </h3>
                <p className="text-gray-400 text-sm mt-1">{reportCourse.name} ({reportCourse.code})</p>
              </div>
              <button onClick={() => setReportCourse(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
            </div>

            {reportLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-10 h-10 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
              </div>
            ) : reportData ? (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Total Sessions Run</div>
                    <div className="text-2xl font-black text-white">{reportData.report.length > 0 ? reportData.report[0].total_sessions : 0}</div>
                  </div>
                  <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Enrolled Students</div>
                    <div className="text-2xl font-black text-white">{reportData.report.length}</div>
                  </div>
                </div>

                {/* Table */}
                {reportData.report.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No students enrolled yet.</p>
                ) : (
                  <div className="rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs uppercase bg-white/5 text-gray-400 font-semibold border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Attended</th>
                          <th className="px-4 py-3 text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.report.map((row: any) => (
                          <tr key={row.student_id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">
                              {row.student_name}
                              <div className="text-xs text-gray-500 font-normal">{row.student_email}</div>
                            </td>
                            <td className="px-4 py-3">
                              {row.attended_sessions} / {row.total_sessions}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                                row.attendance_percentage >= 75 ? 'bg-green-500/20 text-green-400' :
                                row.attendance_percentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {row.attendance_percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-red-400 py-8">Failed to load report data.</p>
            )}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="relative w-full max-w-md rounded-3xl p-6 border border-white/10"
            style={{ background: "rgba(15,12,41,0.95)", boxShadow: "0 0 60px rgba(124,58,237,0.2), 0 25px 50px rgba(0,0,0,0.8)" }}>
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                ➕ Create New Course
              </h3>
              <button onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Course Name</label>
                <input type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all bg-white/5"
                  placeholder="e.g. Artificial Intelligence" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Course Code</label>
                <input type="text" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all bg-white/5"
                  placeholder="e.g. CS-601" required />
              </div>
              <button type="submit" disabled={creating}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.4)'}}>
                {creating ? '⏳ Creating...' : '🚀 Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} University of Engineering and Technology, Peshawar. All rights reserved.</p>
          <p className="text-gray-700 text-xs">Teacher Administration Portal</p>
        </div>
      </footer>
    </div>
  );
}
