import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

/** Redirect to project page with simulation tab */
export function SimulationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      navigate(`/projects/${id}?tab=simulation`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [id, navigate])

  return null
}
