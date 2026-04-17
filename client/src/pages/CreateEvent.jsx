import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Calendar, MapPin, Users, CheckCircle } from 'lucide-react'
import { eventAPI } from '../lib/api'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: { address: '', coordinates: { lat: '', lng: '' } },
    startTime: '',
    endTime: '',
    expectedCrowdSize: '',
    zones: []
  })
  const [newZone, setNewZone] = useState({ name: '', capacity: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await eventAPI.create(formData)
      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addZone = () => {
    if (newZone.name && newZone.capacity) {
      setFormData({
        ...formData,
        zones: [...formData.zones, { name: newZone.name, capacity: parseInt(newZone.capacity) }]
      })
      setNewZone({ name: '', capacity: '' })
    }
  }

  const removeZone = (index) => {
    setFormData({
      ...formData,
      zones: formData.zones.filter((_, i) => i !== index)
    })
  }

  const steps = [
    { number: 1, title: 'Event Details', description: 'Basic information' },
    { number: 2, title: 'Location & Time', description: 'When and where' },
    { number: 3, title: 'Zones', description: 'Define areas' },
    { number: 4, title: 'Review', description: 'Confirm details' }
  ]

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600 mt-1">Set up your event for crowd monitoring</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s.number ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.number ? <CheckCircle className="w-5 h-5" /> : s.number}
              </div>
              <div className="hidden sm:block ml-3">
                <div className="text-sm font-medium text-gray-900">{s.title}</div>
                <div className="text-xs text-gray-500">{s.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-4 ${step > s.number ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g., Summer Music Festival 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none"
                  placeholder="Describe your event..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Crowd Size *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.expectedCrowdSize}
                    onChange={(e) => setFormData({ ...formData, expectedCrowdSize: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="5000"
                    required
                    min="1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Time</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="123 Event Street, City"
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Define Zones</h2>
            <p className="text-gray-600 mb-4">Add zones to monitor (e.g., Main Stage, Food Court, Entrance)</p>
            
            <div className="flex space-x-3 mb-6">
              <input
                type="text"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Zone name"
              />
              <input
                type="number"
                value={newZone.capacity}
                onChange={(e) => setNewZone({ ...newZone, capacity: e.target.value })}
                className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Capacity"
                min="1"
              />
              <button
                type="button"
                onClick={addZone}
                className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {formData.zones.length > 0 && (
              <div className="space-y-2">
                {formData.zones.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <span className="font-medium text-gray-900">{zone.name}</span>
                      <span className="text-gray-500 ml-2">Capacity: {zone.capacity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeZone(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Create</h2>
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div>
                <span className="text-gray-500 text-sm">Event Name</span>
                <p className="font-medium text-gray-900">{formData.name}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Expected Crowd</span>
                <p className="font-medium text-gray-900">{formData.expectedCrowdSize} people</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Location</span>
                <p className="font-medium text-gray-900">{formData.location.address}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Time</span>
                <p className="font-medium text-gray-900">
                  {new Date(formData.startTime).toLocaleString()} - {new Date(formData.endTime).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Zones ({formData.zones.length})</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.zones.map((zone, i) => (
                    <span key={i} className="px-3 py-1 bg-white rounded-full text-sm">
                      {zone.name} ({zone.capacity})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Create Event</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
