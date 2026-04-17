const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function normalizeLegacyResponse(data) {
  if (data.current || data.predicted) {
    return {
      current: data.current ?? {},
      predicted: data.predicted ?? data.current ?? {},
      actions: data.actions ?? {},
    }
  }

  return {
    current: data ?? {},
    predicted: data ?? {},
    actions: {},
  }
}

export async function fetchCrowdData() {
  const response = await fetch(`${API_BASE_URL}/api/crowd`)

  if (!response.ok) {
    throw new Error('Failed to fetch crowd data')
  }

  const data = await response.json()

  return normalizeLegacyResponse(data)
}
