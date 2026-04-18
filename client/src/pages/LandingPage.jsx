import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Eye, Brain, Shield, ArrowRight, Activity, MapPin, Bell, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Activity,
    title: 'Real-time Monitoring',
    description: 'Track crowd density in real-time across multiple zones and locations.'
  },
  {
    icon: Brain,
    title: 'AI-Powered Predictions',
    description: 'Machine learning models predict crowd surges 15-30 minutes in advance.'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Automated notifications for overcrowding, anomalies, and safety concerns.'
  },
  {
    icon: MapPin,
    title: 'Zone Management',
    description: 'Create and manage multiple zones with custom capacity limits.'
  },
  {
    icon: Eye,
    title: 'Public View',
    description: 'Share live crowd status with attendees via unique event codes.'
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description: 'Comprehensive insights and historical data for better planning.'
  }
]

const steps = [
  {
    number: '01',
    title: 'Create Event',
    description: 'Set up your event with location, time, and expected crowd size.'
  },
  {
    number: '02',
    title: 'Define Zones',
    description: 'Add zones with capacity limits - entrances, stages, food courts, etc.'
  },
  {
    number: '03',
    title: 'Monitor & Predict',
    description: 'Our AI analyzes crowd patterns and predicts potential issues.'
  },
  {
    number: '04',
    title: 'Take Action',
    description: 'Receive alerts and recommendations to manage crowd flow effectively.'
  }
]

export default function LandingPage() {
  return (
    <div className="pt-16 bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.18] mix-blend-luminosity"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/20 backdrop-blur-md rounded-full text-sm font-medium mb-8 text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Shield className="w-4 h-4" />
              <span>AI-Powered Crowd Management</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display">
              Manage Crowds{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-purple">
                Intelligently
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Real-time crowd monitoring, AI predictions, and smart alerts for safer events and venues.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/public"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                <Eye className="w-5 h-5" />
                <span>Public View</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="relative border-t border-white/5 bg-white/5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: 'Live', label: 'Zone Monitoring' },
                { value: 'Blueprint', label: 'Venue Heatmaps' },
                { value: 'Role-Based', label: 'Access Control' },
                { value: '15-30 min', label: 'Prediction Window' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-semibold text-slate-200">{stat.value}</div>
                  <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4 font-display">Powerful Features</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to monitor, predict, and manage crowd density effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl hover:bg-slate-800 hover:border-accent-cyan/50 transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
              >
                <div className="w-14 h-14 bg-slate-700/50 border border-slate-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent-cyan/20 group-hover:border-accent-cyan/50 transition-all">
                  <feature.icon className="w-7 h-7 text-accent-cyan" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4 font-display">How It Works</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get started with crowd management in four simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-slate-800 group-hover:text-slate-700 transition-colors mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-full h-px bg-gradient-to-r from-slate-800 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-purple/5 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6 font-display">
              Ready to manage your crowds intelligently?
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Join thousands of event organizers using CrowdIntel for safer, smarter events.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                Create Free Account
              </Link>
              <Link
                to="/access"
                className="px-8 py-4 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 border border-slate-700 transition-all hover:border-slate-500"
              >
                Access Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white font-display">Crowd<span className="text-accent-cyan">Intel</span></span>
              </div>
              <p className="text-sm">AI-powered crowd management for safer events and venues.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/public" className="hover:text-white transition-colors">Public View</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/access" className="hover:text-white transition-colors">Access Portal</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/admin-login" className="hover:text-white transition-colors">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm">support@crowdintel.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            © 2024 CrowdIntel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
