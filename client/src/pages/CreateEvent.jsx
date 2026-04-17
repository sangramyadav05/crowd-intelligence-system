import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Calendar, MapPin, Users, CheckCircle, Image as ImageIcon } from 'lucide-react'
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
    blueprint: null,
    zones: []
  })
  const [newZone, setNewZone] = useState({ name: '', capacity: '' })

  const handleBlueprintUpload = (file) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, blueprint: null }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        blueprint: {
          imageData: reader.result,
          fileName: file.name,
          mimeType: file.type
        }
      }))
    }
    reader.readAsDataURL(file)
  }

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
    { number: 2, title: 'Location & Time', description: 'When, where, and blueprint' },
    { number: 3, title: 'Zones', description: 'Define areas' },
    { number: 4, title: 'Review', description: 'Confirm details' }
  ]

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-display">Create New Event</h1>
        <p className="text-slate-400 mt-1">Set up your event for crowd monitoring</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s.number ? 'bg-accent-cyan text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>
                {step > s.number ? <CheckCircle className="w-5 h-5" /> : s.number}
              </div>
              <div className="hidden sm:block ml-3">
                <div className="text-sm font-medium text-slate-200">{s.title}</div>
                <div className="text-xs text-slate-500">{s.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-4 transition-colors ${step > s.number ? 'bg-accent-cyan shadow-[0_0_5px_rgba(6,182,212,0.4)]' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-xl border border-slate-800 p-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-white mb-6 font-display">Event Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
                  placeholder="e.g., Summer Music Festival 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none h-32 resize-none transition-all"
                  placeholder="Describe your event..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expected Crowd Size *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    value={formData.expectedCrowdSize}
                    onChange={(e) => setFormData({ ...formData, expectedCrowdSize: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
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
            <h2 className="text-xl font-semibold text-white mb-6 font-display">Location & Time</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
                    placeholder="123 Event Street, City"
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Time *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Time *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-800 p-3 shadow-sm border border-slate-700">
                    <ImageIcon className="w-5 h-5 text-accent-cyan" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Venue Blueprint</label>
                    <p className="text-sm text-slate-500 mb-4">
                      Upload a venue image to use as the base for the event heatmap in admin and public view.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBlueprintUpload(e.target.files?.[0])}
                      className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-accent-cyan file:px-4 file:py-2 file:font-semibold file:text-slate-900 hover:file:bg-cyan-400 transition-all cursor-pointer"
                    />
                    {formData.blueprint && (
                      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <img
                            src={formData.blueprint.imageData}
                            alt={formData.blueprint.fileName}
                            className="h-24 w-full rounded-xl object-cover sm:w-40 border border-slate-600"
                          />
                          <div>
                            <p className="font-medium text-slate-200">{formData.blueprint.fileName}</p>
                            <p className="text-sm text-slate-500">Ready to use as the live heatmap background.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-white mb-6 font-display">Define Zones</h2>
            <p className="text-slate-400 mb-4">Add zones to monitor (e.g., Main Stage, Food Court, Entrance)</p>
            
            <div className="flex space-x-3 mb-6">
              <input
                type="text"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
                placeholder="Zone name"
              />
              <input
                type="number"
                value={newZone.capacity}
                onChange={(e) => setNewZone({ ...newZone, capacity: e.target.value })}
                className="w-32 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
                placeholder="Capacity"
                min="1"
              />
              <button
                type="button"
                onClick={addZone}
                className="px-4 py-3 bg-accent-cyan text-slate-900 rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {formData.zones.length > 0 && (
              <div className="space-y-2">
                {formData.zones.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <div>
                      <span className="font-medium text-slate-200">{zone.name}</span>
                      <span className="text-slate-500 ml-2">Capacity: {zone.capacity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeZone(index)}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
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
            <h2 className="text-xl font-semibold text-white mb-6 font-display">Review & Create</h2>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
              <div>
                <span className="text-slate-500 text-sm">Event Name</span>
                <p className="font-medium text-white">{formData.name}</p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Expected Crowd</span>
                <p className="font-medium text-white">{formData.expectedCrowdSize} people</p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Location</span>
                <p className="font-medium text-white">{formData.location.address}</p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Time</span>
                <p className="font-medium text-white">
                  {new Date(formData.startTime).toLocaleString()} - {new Date(formData.endTime).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Zones ({formData.zones.length})</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.zones.map((zone, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-full text-sm text-slate-200">
                      {zone.name} ({zone.capacity})
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Blueprint</span>
                <p className="font-medium text-white">
                  {formData.blueprint?.fileName || 'No blueprint uploaded'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 border border-slate-700 rounded-xl font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-xl font-medium hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)] border-none"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-xl font-medium hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center space-x-2 border-none"
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
