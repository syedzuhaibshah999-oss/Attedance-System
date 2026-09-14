"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

const COURSE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100', dot: 'bg-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100', dot: 'bg-cyan-500' },
];

export default function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);

  // Create Course Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [creating, setCreating] = useState(false);

  // Report Modal
  const [reportCourse, setReportCourse] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Manual Attendance Modal
  const [manualSession, setManualSession] = useState<any>(null);
  const [manualCourse, setManualCourse] = useState<any>(null);
  const [sessionStudents, setSessionStudents] = useState<any[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    Promise.all([
      fetch(`${getApiBase()}/courses/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.status === 401) { router.push('/login'); return null; }
        return res.json();
      }),
      fetch(`${getApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()),
    ]).then(([coursesData, userData]) => {
      if (Array.isArray(coursesData)) setCourses(coursesData);
      if (userData) setUser(userData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const startSession = async (courseId: number) => {
    setStarting(courseId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${getApiBase()}/attendance/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId, duration_minutes: 2 })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/session/${data.id}?token=${data.qr_token}`);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to start session');
        setStarting(null);
      }
    } catch {
      alert('Network error');
      setStarting(null);
    }
  };

  const openManualModal = async (course: any) => {
    setManualCourse(course);
    setManualLoading(true);
    const token = localStorage.getItem('token');

    // First, start a session so we have a session_id
    try {
      const startRes = await fetch(`${getApiBase()}/attendance/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: course.id, duration_minutes: 60 })
      });
      if (!startRes.ok) {
        const err = await startRes.json();
        alert(err.detail || 'Could not start session for manual marking');
        setManualLoading(false);
        return;
      }
      const sessionData = await startRes.json();
      setManualSession(sessionData);

      // Load students for this session
      const studRes = await fetch(`${getApiBase()}/attendance/session/${sessionData.id}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (studRes.ok) {
        const data = await studRes.json();
        setSessionStudents(data.students || []);
      }
    } catch {
      alert('Network error');
    } finally {
      setManualLoading(false);
    }
  };

  const toggleStudentAttendance = async (student: any) => {
    if (!manualSession) return;
    setTogglingId(student.student_id);
    const token = localStorage.getItem('token');
    const method = student.is_present ? 'DELETE' : 'POST';
    const endpoint = student.is_present ? '/attendance/mark-manual' : '/attendance/mark-manual';

    try {
      const res = await fetch(`${getApiBase()}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: manualSession.id, student_id: student.student_id })
      });
      if (res.ok) {
        setSessionStudents(prev =>
          prev.map(s =>
            s.student_id === student.student_id ? { ...s, is_present: !s.is_present } : s
          )
        );
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update attendance');
      }
    } catch {
      alert('Network error');
    } finally {
      setTogglingId(null);
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
      if (res.ok) setReportData(await res.json());
    } catch { /* noop */ } finally {
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
        setCourses(prev => [...prev, newCourse]);
        setShowCreateModal(false);
        setNewCourseName('');
        setNewCourseCode('');
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create course');
      }
    } catch { alert('Network error'); } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (!confirm(`Delete "${courseName}"? All attendance records will be permanently removed.`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${getApiBase()}/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
      } else {
        alert('Failed to delete course');
      }
    } catch { alert('Network error'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="Department of Software Engineering UET PESHAWAR"
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">Department of Software Engineering UET PESHAWAR</div>
              <div className="text-xs text-slate-500">Attendance System</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900 leading-tight">{user.full_name}</span>
                <span className="text-xs text-blue-600">{user.email}</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs text-blue-700 font-medium">Teacher Portal</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Your Courses</h1>
            <p className="text-slate-500 mt-1 text-sm">Start a QR session or mark attendance manually</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            + New Course
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Courses', value: courses.length, icon: '📚', color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Enrolled Students', value: reportData?.report?.length ?? '—', icon: '👥', color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Sessions Run', value: reportData?.report?.[0]?.total_sessions ?? '—', icon: '📡', color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Active Today', value: reportData ? 1 : 0, icon: '✅', color: 'text-amber-700', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-xl mb-3`}>
                {stat.icon}
              </div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-slate-500 text-sm">Loading your courses...</p>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No courses yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create your first course to start taking attendance</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              + Create First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((course, i) => {
              const color = COURSE_COLORS[i % COURSE_COLORS.length];
              return (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                  {/* Course header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.border} border flex items-center justify-center`}>
                      <span className="text-xl">📘</span>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${color.badge} ${color.text}`}>
                      {course.code}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-5 leading-snug">{course.name}</h3>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {/* QR Session */}
                    <button
                      onClick={() => startSession(course.id)}
                      disabled={starting === course.id}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {starting === course.id ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Starting...
                        </>
                      ) : '📡 Start QR Session'}
                    </button>

                    {/* Bottom row */}
                    <div className="flex gap-2">
                      {/* Manual Attendance */}
                      <button
                        onClick={() => openManualModal(course)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5"
                      >
                        ✏️ Mark Manually
                      </button>
                      {/* Report */}
                      <button
                        onClick={() => viewReport(course)}
                        className="px-3.5 py-2.5 rounded-xl text-slate-600 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all text-sm"
                        title="View Report"
                      >
                        📊
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.name)}
                        className="px-3.5 py-2.5 rounded-xl text-slate-600 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-sm"
                        title="Delete Course"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ───── Manual Attendance Modal ───── */}
      {manualCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">✏️ Manual Attendance</h3>
                <p className="text-sm text-slate-500 mt-0.5">{manualCourse.name} ({manualCourse.code})</p>
              </div>
              <button
                onClick={() => { setManualCourse(null); setManualSession(null); setSessionStudents([]); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-all text-sm"
              >✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {manualLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <p className="text-slate-500 text-sm">Loading students...</p>
                </div>
              ) : sessionStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-slate-500 text-sm">No students enrolled in this course yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Toggle attendance — {sessionStudents.filter(s => s.is_present).length} / {sessionStudents.length} present
                  </p>
                  {sessionStudents.map(student => (
                    <div
                      key={student.student_id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        student.is_present
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          student.is_present ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {student.student_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{student.student_name}</p>
                          <p className="text-xs text-slate-500">{student.student_email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStudentAttendance(student)}
                        disabled={togglingId === student.student_id}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                          student.is_present
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {togglingId === student.student_id ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : student.is_present ? '✓ Present' : 'Mark Present'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!manualLoading && sessionStudents.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <strong className="text-slate-900">{sessionStudents.filter(s => s.is_present).length}</strong> of{' '}
                  <strong className="text-slate-900">{sessionStudents.length}</strong> marked present
                </span>
                <button
                  onClick={() => { setManualCourse(null); setManualSession(null); setSessionStudents([]); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Done ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Report Modal ───── */}
      {reportCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">📊 Attendance Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">{reportCourse.name} ({reportCourse.code})</p>
              </div>
              <button
                onClick={() => { setReportCourse(null); setReportData(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 border border-slate-200 transition-all text-sm"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {reportLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                </div>
              ) : reportData ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 mb-1">Total Sessions</div>
                      <div className="text-2xl font-black text-slate-900">
                        {reportData.report.length > 0 ? reportData.report[0].total_sessions : 0}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 mb-1">Enrolled Students</div>
                      <div className="text-2xl font-black text-slate-900">{reportData.report.length}</div>
                    </div>
                  </div>
                  {reportData.report.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">No students enrolled yet.</p>
                  ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Attended</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData.report.map((row: any) => (
                            <tr key={row.student_id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-900">{row.student_name}</p>
                                <p className="text-xs text-slate-500">{row.student_email}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {row.attended_sessions} / {row.total_sessions}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  row.attendance_percentage >= 75
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : row.attendance_percentage >= 50
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
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
                </>
              ) : (
                <p className="text-center text-red-500 text-sm py-8">Failed to load report.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── Create Course Modal ───── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">+ Create New Course</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 border border-slate-200 transition-all text-sm"
              >✕</button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Course Name</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={e => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                  placeholder="e.g. Artificial Intelligence"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Course Code</label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={e => setNewCourseCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                  placeholder="e.g. CS-601"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 bg-blue-600"
              >
                {creating ? 'Creating...' : '🚀 Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-1">
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} University of Engineering and Technology, Peshawar</p>
          <p className="text-slate-400 text-xs">Teacher Administration Portal</p>
        </div>
      </footer>
    </div>
  );
}


