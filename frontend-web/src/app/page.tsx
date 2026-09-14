import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
            <Image
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
              alt="Department of Software Engineering UET PESHAWAR"
              width={36}
              height={36}
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">Department of Software Engineering UET PESHAWAR</div>
            <div className="text-xs text-slate-500">Smart Attendance System</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Logo + Title */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white border border-slate-200 shadow-lg mb-6 overflow-hidden">
            <Image
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
              alt="Department of Software Engineering UET PESHAWAR"
              width={100}
              height={100}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
            UET Peshawar
          </h1>
          <p className="text-xl font-semibold text-blue-700">Smart Attendance Management System</p>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            Streamlined QR-based attendance tracking for faculty and students
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-xl">
          {/* Teacher Portal */}
          <Link
            href="/login"
            className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-5 group-hover:bg-blue-100 transition-colors">
              👨‍🏫
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Teacher Portal</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Manage courses, generate QR sessions, and track student attendance
            </p>
            <div className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold text-center group-hover:bg-blue-700 transition-colors">
              Sign In as Teacher →
            </div>
          </Link>

          {/* Student Portal */}
          <Link
            href="/student"
            className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mb-5 group-hover:bg-emerald-100 transition-colors">
              👨‍🎓
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Student Portal</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Scan QR codes to mark your daily attendance instantly
            </p>
            <div className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center group-hover:bg-emerald-700 transition-colors">
              Sign In as Student →
            </div>
          </Link>
        </div>

        {/* Features row */}
        <div className="mt-14 grid grid-cols-3 gap-8 max-w-xl w-full">
          {[
            { icon: '📡', label: 'Live QR Sessions' },
            { icon: '📊', label: 'Real-time Reports' },
            { icon: '🔒', label: 'Secure & Reliable' },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs font-semibold text-slate-500 text-center">{f.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-5">
        <p className="text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} University of Engineering and Technology, Peshawar. All rights reserved.
        </p>
      </footer>
    </div>
  );
}


