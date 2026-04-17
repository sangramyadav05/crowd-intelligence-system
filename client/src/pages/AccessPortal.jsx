import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LogIn, Users, ArrowRight, Zap } from 'lucide-react'

const roles = [
  {
    id: 'user',
    title: 'Crowd Manager',
    description: 'Sign in with your registered account details.',
    icon: LogIn,
    accent: 'bg-slate-900 text-white',
    iconBg: 'bg-slate-900/10',
    iconColor: 'text-slate-900',
    glowColor: 'from-slate-900/20 to-transparent',
    link: '/login'
  },
  {
    id: 'staff',
    title: 'Coordinator',
    description: 'Incidents, Q&A responses, field updates.',
    icon: Users,
    accent: 'bg-indigo-600 text-white',
    iconBg: 'bg-indigo-600/10',
    iconColor: 'text-indigo-600',
    glowColor: 'from-indigo-600/20 to-transparent',
    link: '/login?role=staff'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 }
  }
}

export default function AccessPortal() {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-900 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center space-x-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-purple-200"
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">Live Operations Platform</span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Access Portal
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select your role to enter the dynamic crowd operations center and take command of live events
          </p>
        </motion.div>

        <motion.div 
          className="grid sm:grid-cols-2 gap-6 lg:gap-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${role.glowColor} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300`}></div>
              
              {/* Card */}
              <div className="relative rounded-2xl border border-white/40 backdrop-blur-lg bg-white/80 hover:bg-white/95 shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full">
                
                {/* Icon container */}
                <div className="mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${role.iconBg} backdrop-blur-sm border border-white/50`}
                  >
                    <role.icon className={`w-8 h-8 ${role.iconColor}`} />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h2 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${role.accent === 'bg-slate-900 text-white' ? 'from-slate-900 to-slate-700' : role.accent === 'bg-indigo-600 text-white' ? 'from-indigo-600 to-indigo-700' : role.accent === 'bg-emerald-600 text-white' ? 'from-emerald-600 to-emerald-700' : 'from-blue-600 to-blue-700'} bg-clip-text text-transparent`}>
                    {role.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={role.link}
                    className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${role.accent} hover:shadow-lg hover:shadow-current/30`}
                  >
                    <span>Continue</span>
                    <motion.div whileHover={{ x: 4 }}>
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-slate-600">
            Looking for public access code lookup?{' '}
            <Link to="/public" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors">
              Go to Public View
            </Link>
          </p>
        </motion.div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

