import { RenderJob } from '../../../main/types'
import { JobCard } from './JobCard'
import styles from './JobList.module.css'

interface Props {
  jobs: RenderJob[]
  selectedJobId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onOpenFolder: (id: string) => void
}

export function JobList({ jobs, selectedJobId, onSelect, onRemove, onCancel, onRetry, onOpenFolder }: Props): JSX.Element {
  if (jobs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No blend files queued yet.</p>
        <p className={styles.hint}>Click &ldquo;+ Add Blend File&rdquo; or drop a .blend file here.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {jobs.map((job, index) => (
        <JobCard
          key={job.id}
          job={job}
          index={index}
          selected={job.id === selectedJobId}
          onSelect={() => onSelect(job.id)}
          onRemove={() => onRemove(job.id)}
          onCancel={() => onCancel(job.id)}
          onRetry={() => onRetry(job.id)}
          onOpenFolder={() => onOpenFolder(job.id)}
        />
      ))}
    </div>
  )
}
