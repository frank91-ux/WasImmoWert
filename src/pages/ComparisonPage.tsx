import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { ProjectComparisonView } from '@/components/comparison/ProjectComparisonView'

export function ComparisonPage() {
  const { loaded, loadProjects } = useProjectStore()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!loaded) loadProjects()
  }, [loaded, loadProjects])

  if (!loaded) return null

  const idsParam = searchParams.get('ids')
  const initialIds = idsParam ? idsParam.split(',').filter(Boolean) : undefined

  return <ProjectComparisonView initialSelectedIds={initialIds} />
}
