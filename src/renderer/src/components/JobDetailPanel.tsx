import { useEffect, useRef } from 'react'
import { RenderJob, JobStatus } from '../../../main/types'
import styles from './JobDetailPanel.module.css'

interface Props {
  job: RenderJob
  onClose: () => void
}

const STATUS_COLOR: Record<JobStatus, string> = {
  pending: 'var(--info)',
  running: 'var(--warning)',
  completed: 'var(--success)',
  failed: 'var(--error)',
  cancelled: 'var(--text-muted)'
}

export function JobDetailPanel({ job, onClose }: Props): JSX.Element {
  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log to bottom when new lines arrive
  useEffect(() => {
    const el = logRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    if (atBottom) el.scrollTop = el.scrollHeight
  }, [job.log.length])

  const totalFrames = Math.floor((job.frameEnd - job.frameStart) / job.frameStep) + 1

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.dot} style={{ background: STATUS_COLOR[job.status] }} />
          <span className={styles.name}>{job.name}</span>
        </div>
        <button className={styles.close} onClick={onClose} title="Close panel">✕</button>
      </div>

      <div className={styles.body}>
        {/* Thumbnail */}
        {job.thumbnail && (
          <div className={styles.thumbnailWrap}>
            <img src={job.thumbnail} alt="Scene preview" className={styles.thumbnail} />
          </div>
        )}
        {!job.thumbnail && (
          <div className={styles.noThumb}>No preview</div>
        )}

        {/* Progress (only when running) */}
        {job.status === 'running' && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>Rendering</span>
              <span>{job.progress}%{job.currentFrame != null ? ` — frame ${job.currentFrame}` : ''}</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${job.progress}%` }} />
            </div>
          </div>
        )}

        {/* Error */}
        {job.status === 'failed' && job.error && (
          <div className={styles.errorBox}>{job.error}</div>
        )}

        {/* Params */}
        <div className={styles.section}>Parameters</div>
        <div className={styles.params}>
          <Param label="File" value={job.blendFile} mono />
          <Param label="Output" value={job.outputPath} mono />
          <Param label="Engine" value={job.engine} />
          <Param label="Frames" value={`${job.frameStart} → ${job.frameEnd} (${totalFrames} frames, step ${job.frameStep})`} />
          {job.samples != null && <Param label="Samples" value={String(job.samples)} />}
          {job.resolutionX != null && (
            <Param label="Resolution" value={`${job.resolutionX} × ${job.resolutionY ?? '?'} @ ${job.resolutionScale ?? 100}%`} />
          )}
          <Param label="Threads" value={job.threads === 0 ? 'Auto' : String(job.threads)} />
          {job.durationMs != null && (
            <Param label="Duration" value={formatDuration(job.durationMs)} />
          )}
        </div>

        {/* Open output button */}
        <button
          className={styles.btnOpen}
          onClick={() => window.api.openPath(job.outputPath)}
        >
          Open Output Folder ↗
        </button>

        {/* Log */}
        <div className={styles.section}>Log</div>
        <div className={styles.log} ref={logRef}>
          {job.log.length === 0
            ? <span className={styles.logEmpty}>No output yet.</span>
            : job.log.map((line, i) => <div key={i} className={styles.logLine}>{line}</div>)
          }
        </div>
      </div>
    </div>
  )
}

function Param({ label, value, mono }: { label: string; value: string; mono?: boolean }): JSX.Element {
  return (
    <div className={styles.param}>
      <span className={styles.paramLabel}>{label}</span>
      <span className={`${styles.paramValue} ${mono ? styles.mono : ''}`} title={value}>{value}</span>
    </div>
  )
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}
