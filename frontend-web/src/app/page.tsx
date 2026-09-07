import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      
      {/* Animated orbs */}
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse pointer-events-none"
        style={{background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-5rem', left: '-5rem'}} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse pointer-events-none"
        style={{background: 'radial-gradient(circle, #2563eb, transparent)', bottom: '-5rem', right: '-5rem', animationDelay: '1s'}} />

      <div className="relative z-10 w-full max-w-2xl px-6 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl mb-8 bg-white p-3"
          style={{boxShadow: '0 0 50px rgba(124,58,237,0.5)'}}>
          <Image
            src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
            alt="UET Peshawar"
            width={110}
            height={110}
            className="object-contain"
            unoptimized
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4" style={{fontFamily: 'var(--font-poppins)'}}>
          UET Peshawar
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-violet-300 mb-12">
          Smart Attendance System
        </h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-lg mx-auto">
          <Link href="/login" 
            className="group relative rounded-2xl p-6 border border-white/10 hover:border-violet-500/50 transition-all duration-300 hover:scale-105"
            style={{background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'}}>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👨‍🏫</div>
            <h3 className="text-xl font-bold text-white mb-2" style={{fontFamily: 'var(--font-poppins)'}}>Teacher Portal</h3>
            <p className="text-sm text-gray-400">Manage courses and generate attendance QR codes.</p>
          </Link>

          <Link href="/student" 
            className="group relative rounded-2xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105"
            style={{background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'}}>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👨‍🎓</div>
            <h3 className="text-xl font-bold text-white mb-2" style={{fontFamily: 'var(--font-poppins)'}}>Student Portal</h3>
            <p className="text-sm text-gray-400">Scan QR codes to mark your daily attendance.</p>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-gray-500 text-sm font-medium">
        © {new Date().getFullYear()} University of Engineering and Technology, Peshawar
      </div>
    </div>
  );
}
