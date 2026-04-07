import { useEffect, useRef } from 'react'
import { RenderJob } from '../../../main/types'
import styles from './LogPanel.module.css'

interface Props {
  job: RenderJob
}

export function LogPanel({ job }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [job.log.length])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Log — {job.name}</span>
        <button
          className={styles.btnOpen}
          title="Open output folder"
          onClick={() => window.api.openPath(job.outputPath)}
        >
          Open Output ↗
        </button>
      </div>

      <div className={styles.info}>
        <InfoRow label="File" value={job.blendFile} mono />
        <InfoRow label="Output" value={job.outputPath} mono />
        <InfoRow label="Engine" value={job.engine} />
        <InfoRow label="Frames" value={`${job.frameStart} → ${job.frameEnd} (step ${job.frameStep})`} />
        {job.samples != null && <InfoRow label="Samples" value={String(job.samples)} />}
        {job.resolutionX != null && (
          <InfoRow
            label="Resolution"
            value={`${job.resolutionX}×${job.resolutionY ?? '?'} @ ${job.resolutionScale ?? 100}%`}
          />
        )}
        <InfoRow label="Threads" value={job.threads === 0 ? 'Auto' : String(job.threads)} />
      </div>

      <div className={styles.log}>
        {job.log.length === 0 ? (
          <span className={styles.empty}>No output yet.</span>
        ) : (
          job.log.map((line, i) => (
            <div key={i} className={styles.line}>{line}</div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }): JSX.Element {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`} title={value}>
        {value}
      </span>
    </div>
  )
}
