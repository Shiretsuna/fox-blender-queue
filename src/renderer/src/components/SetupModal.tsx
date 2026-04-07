import { useState } from 'react'
import styles from './SetupModal.module.css'

interface Props {
  onDone: (blenderPath: string) => void
}

type Step = 'welcome' | 'detecting' | 'manual'

export function SetupModal({ onDone }: Props): JSX.Element {
  const [step, setStep] = useState<Step>('welcome')
  const [manualPath, setManualPath] = useState('')
  const [detectError, setDetectError] = useState(false)

  const handleAutoDetect = async (): Promise<void> => {
    setStep('detecting')
    setDetectError(false)
    const path = await window.api.detectBlender()
    if (path) {
      await window.api.setBlenderPath(path)
      onDone(path)
    } else {
      setDetectError(true)
      setStep('manual')
    }
  }

  const handleBrowse = async (): Promise<void> => {
    const path = await window.api.openBlenderExeDialog()
    if (path) setManualPath(path)
  }

  const handleConfirmManual = async (): Promise<void> => {
    const path = manualPath.trim()
    if (!path) return
    await window.api.setBlenderPath(path)
    onDone(path)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.logoRow}>
          <span className={styles.logo}>&#9650;</span>
          <span className={styles.appName}>Shiretsuna&apos;s Blender Queue</span>
        </div>

        {step === 'welcome' && (
          <>
            <h2 className={styles.title}>Welcome!</h2>
            <p className={styles.desc}>
              To render your scenes, this app needs to know where Blender is installed.
              We can try to find it automatically, or you can point to it manually.
            </p>
            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={handleAutoDetect}>
                Auto-detect Blender
              </button>
              <button className={styles.btnSecondary} onClick={() => setStep('manual')}>
                Set path manually
              </button>
            </div>
          </>
        )}

        {step === 'detecting' && (
          <>
            <h2 className={styles.title}>Looking for Blender…</h2>
            <div className={styles.spinner} />
            <p className={styles.desc}>Checking common install locations.</p>
          </>
        )}

        {step === 'manual' && (
          <>
            <h2 className={styles.title}>
              {detectError ? 'Blender not found' : 'Set Blender path'}
            </h2>
            {detectError && (
              <p className={styles.warn}>
                Could not find Blender automatically. Please locate the executable below.
              </p>
            )}
            {!detectError && (
              <p className={styles.desc}>
                Point to your <code>blender.exe</code> (Windows) or <code>blender</code> binary.
              </p>
            )}
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                placeholder="C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
              />
              <button className={styles.btnBrowse} onClick={handleBrowse}>Browse</button>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.btnPrimary}
                onClick={handleConfirmManual}
                disabled={!manualPath.trim()}
              >
                Confirm
              </button>
              {!detectError && (
                <button className={styles.btnSecondary} onClick={() => setStep('welcome')}>
                  Back
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
