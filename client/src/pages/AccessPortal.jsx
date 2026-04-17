import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Users, Eye, UserCircle, ArrowRight } from 'lucide-react'

const roles = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Command center for event ops and controls.',
    icon: Shield,
    accent: 'bg-slate-900 text-white',
    link: '/login?role=admin'
  },
  {
    id: 'staff',
    title: 'Staff',
    description: 'Incidents, Q&A responses, field updates.',
    icon: Users,
    accent: 'bg-indigo-600 text-white',
    link: '/login?role=staff'
  },
  {
    id: 'crowd',
    title: 'Crowd',
    description: 'Live instructions, flow arrows, and safety updates.',
    icon: UserCircle,
    accent: 'bg-emerald-600 text-white',
    link: '/login?role=crowd'
  },
  {
    id: 'observer',
    title: 'Observer',
    description: 'Read-only crowd view for oversight.',
    icon: Eye,
    accent: 'bg-slate-700 text-white',
    link: '/login?role=observer'
  }
]

export default function AccessPortal() {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Access Portal</h1>
          <p className="mt-3 text-slate-200">
            Choose your role to continue into the live crowd operations platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl ${role.accent}`}>
                    <role.icon className="w-5 h-5" />
                    <span className="font-semibold">{role.title}</span>
                  </div>
                  <p className="mt-3 text-slate-200">{role.description}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  to={role.link}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-slate-300">
          <p>
            Looking for public access code lookup?{' '}
            <Link to="/public" className="text-indigo-300 hover:text-indigo-200 underline">
              Go to Public View
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

