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
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
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
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8"
            >
              <Shield className="w-4 h-4" />
              <span>AI-Powered Crowd Management</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Manage Crowds{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-100">
                Intelligently
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Real-time crowd monitoring, AI predictions, and smart alerts for safer events and venues.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-900 rounded-xl font-semibold hover:bg-primary-50 transition-all hover:scale-105"
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
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '500+', label: 'Events Managed' },
                { value: '2M+', label: 'People Monitored' },
                { value: '99.9%', label: 'Uptime' },
                { value: '15min', label: 'Prediction Window' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-primary-200 text-sm mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                className="group p-8 bg-gray-50 rounded-2xl hover:bg-primary-50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                <div className="text-6xl font-bold text-primary-200 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-full h-px bg-gradient-to-r from-primary-300 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to manage your crowds intelligently?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Join thousands of event organizers using CrowdIntel for safer, smarter events.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-primary-900 rounded-xl font-semibold hover:bg-primary-50 transition-all"
              >
                Create Free Account
              </Link>
              <Link
                to="/access"
                className="px-8 py-4 bg-primary-800 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
              >
                Access Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">Crowd<span className="text-primary-400">Intel</span></span>
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
