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

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Portal</h1>
            <p className="text-gray-600 mt-2">Incident reporting, Q&A response, and live command feed.</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100">
            <Radio className={`w-4 h-4 ${connected ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm text-gray-700">{connected ? 'Socket connected' : 'Socket disconnected'}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Active Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
          >
            {events.length === 0 && <option value="">No events available</option>}
            {events.map((event) => (
              <option key={event._id} value={event.eventId || event._id}>{event.name}</option>
            ))}
          </select>
        </div>

        <form onSubmit={submitIncident} className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span>Report Incident</span>
          </h2>
          <textarea
            value={incident}
            onChange={(e) => setIncident(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24"
            placeholder="Describe the incident..."
          />
          <button type="submit" className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Report
          </button>
        </form>

        <form onSubmit={submitAnswer} className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Send className="w-4 h-4 text-primary-600" />
            <span>Send Crowd Answer</span>
          </h2>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24"
            placeholder="Answer a public question..."
          />
          <button type="submit" className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Broadcast
          </button>
        </form>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-gray-700" />
          <span>Live Feed</span>
        </h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {feed.length === 0 && <p className="text-sm text-gray-500">No live activity yet.</p>}
          {feed.map((item, index) => (
            <div key={`${item.type}-${index}`} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs uppercase text-gray-500">{item.type}</p>
              <p className="text-sm text-gray-900">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
