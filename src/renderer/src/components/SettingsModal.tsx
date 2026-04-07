import { useState } from 'react'
import { QueueState } from '../../../main/types'
import styles from './Modal.module.css'

interface Props {
  state: QueueState
  onSetBlenderPath: (path: string) => Promise<void>
  onClose: () => void
}

export function SettingsModal({ state, onSetBlenderPath, onClose }: Props): JSX.Element {
  const [blenderPath, setBlenderPath] = useState(state.blenderPath)

  const pickExe = async (): Promise<void> => {
    const path = await window.api.openBlenderExeDialog()
    if (path) setBlenderPath(path)
  }

  const detectAuto = async (): Promise<void> => {
    const path = await window.api.detectBlender()
    if (path) setBlenderPath(path)
    else alert('Could not auto-detect Blender. Please set the path manually.')
  }

  const handleSave = async (): Promise<void> => {
    await onSetBlenderPath(blenderPath.trim())
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label>Blender Executable Path</label>
            <div className={styles.row}>
              <input
                value={blenderPath}
                onChange={(e) => setBlenderPath(e.target.value)}
                placeholder="blender"
              />
              <button className={styles.btnPick} onClick={pickExe}>Browse</button>
            </div>
            <span className={styles.hint}>
              You can also type &ldquo;blender&rdquo; if it&apos;s on your PATH.
            </span>
          </div>

          <button className={styles.btnSecondary} onClick={detectAuto} style={{ marginTop: 4 }}>
            Auto-detect Blender
          </button>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button className={styles.btnSubmit} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
