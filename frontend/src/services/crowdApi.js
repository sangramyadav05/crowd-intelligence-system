const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function fetchCrowdData() {
  const response = await fetch(`${API_BASE_URL}/api/crowd`)

  if (!response.ok) {
    throw new Error('Failed to fetch crowd data')
  }

  return response.json()
}
