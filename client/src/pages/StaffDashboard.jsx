import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, MessageSquare, Send, Radio } from 'lucide-react'
import { staffAPI } from '../lib/api'
import { staffSocket, joinEventRoom } from '../lib/socket'

export default function StaffDashboard() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [incident, setIncident] = useState('')
  const [answer, setAnswer] = useState('')
  const [feed, setFeed] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await staffAPI.getEvents()
        setEvents(data)
        if (data[0]) setSelectedEventId(data[0].eventId || data[0]._id)
      } catch (error) {
        console.error('Error loading staff events:', error)
      }
    }
    init()
  }, [])

  useEffect(() => {
    staffSocket.connect()

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onQuestion = (payload) => {
      setFeed((prev) => [{ type: 'question', text: payload.question, at: new Date() }, ...prev].slice(0, 20))
    }
    const onInstruction = (payload) => {
      setFeed((prev) => [{ type: 'instruction', text: payload.command?.message || payload.message, at: new Date() }, ...prev].slice(0, 20))
    }
    const onOperationsUpdate = (payload) => {
      setFeed((prev) => [{ type: `ops:${payload.type}`, text: payload.message, at: new Date() }, ...prev].slice(0, 20))
    }

    staffSocket.on('connect', onConnect)
    staffSocket.on('disconnect', onDisconnect)
    staffSocket.on('gathering_question', onQuestion)
    staffSocket.on('gathering_instruction', onInstruction)
    staffSocket.on('operations_update', onOperationsUpdate)

    return () => {
      staffSocket.off('connect', onConnect)
      staffSocket.off('disconnect', onDisconnect)
      staffSocket.off('gathering_question', onQuestion)
      staffSocket.off('gathering_instruction', onInstruction)
      staffSocket.off('operations_update', onOperationsUpdate)
      staffSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    joinEventRoom(staffSocket, selectedEventId)
  }, [selectedEventId])

  const submitIncident = async (e) => {
    e.preventDefault()
    if (!selectedEventId || !incident.trim()) return
    try {
      await staffAPI.reportIncident(selectedEventId, { message: incident.trim(), severity: 'warning' })
      setFeed((prev) => [{ type: 'incident', text: incident.trim(), at: new Date() }, ...prev].slice(0, 20))
      setIncident('')
    } catch (error) {
      console.error('Unable to report incident:', error)
    }
  }

  const submitAnswer = async (e) => {
    e.preventDefault()
    if (!selectedEventId || !answer.trim()) return
    try {
      await staffAPI.sendAnswer(selectedEventId, { message: answer.trim() })
      setFeed((prev) => [{ type: 'answer', text: answer.trim(), at: new Date() }, ...prev].slice(0, 20))
      setAnswer('')
    } catch (error) {
      console.error('Unable to send answer:', error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Coordinator Portal</h1>
            <p className="text-slate-400 mt-2">Incident reporting, Q&A response, and live command feed.</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 shadow-inner">
            <Radio className={`w-4 h-4 ${connected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-sm text-slate-300">{connected ? 'Socket connected' : 'Socket disconnected'}</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-6 mt-8">
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl p-4">
          <label className="text-sm font-medium text-slate-300 block mb-2">Active Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white outline-none focus:border-accent-purple"
          >
            {events.length === 0 && <option value="">No events available</option>}
            {events.map((event) => (
              <option key={event._id} value={event.eventId || event._id}>{event.name}</option>
            ))}
          </select>
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={submitIncident} className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl p-4">
          <h2 className="font-semibold text-white mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Report Incident</span>
          </h2>
          <textarea
            value={incident}
            onChange={(e) => setIncident(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg h-24 text-white placeholder-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="Describe the incident..."
          />
          <button type="submit" className="mt-3 px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-lg hover:bg-orange-500/30 transition-colors">
            Report
          </button>
        </motion.form>

        <motion.form variants={itemVariants} onSubmit={submitAnswer} className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl p-4">
          <h2 className="font-semibold text-white mb-3 flex items-center space-x-2">
            <Send className="w-4 h-4 text-accent-cyan" />
            <span>Send Crowd Answer</span>
          </h2>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg h-24 text-white placeholder-slate-500 outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
            placeholder="Answer a public question..."
          />
          <button type="submit" className="mt-3 px-4 py-2 bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)] border-none">
            Broadcast
          </button>
        </motion.form>
      </motion.div>

      <div className="mt-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl p-4">
        <h2 className="font-semibold text-white mb-3 flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>Live Feed</span>
        </h2>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {feed.length === 0 && <p className="text-sm text-slate-500">No live activity yet.</p>}
          {feed.map((item, index) => (
            <div key={`${item.type}-${index}`} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-xs uppercase text-slate-500">{item.type}</p>
              <p className="text-sm text-slate-200 mt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
