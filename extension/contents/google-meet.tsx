import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import Sidebar from "~components/Sidebar"

export const config: PlasmoCSConfig = {
  matches: ["https://meet.google.com/*"],
  all_frames: false
}

// Detect if we're in an active Google Meet call
function isInMeetingCall(): boolean {
  // Check for the presence of meeting controls (camera, mic buttons)
  const controls = document.querySelector('[data-is-muted]') ||
                   document.querySelector('[data-is-cameramuted]') ||
                   document.querySelector('div[jsname="Lskrqb"]'); // Meet control bar

  return !!controls;
}

// Main content script component
const GoogleMeetAssistant = () => {
  const [inCall, setInCall] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  useEffect(() => {
    // Check if we're in a call on mount
    const checkCallStatus = () => {
      const isInCall = isInMeetingCall()
      setInCall(isInCall)

      if (isInCall && !sidebarVisible) {
        setSidebarVisible(true)
      }
    }

    // Initial check
    checkCallStatus()

    // Poll for changes (Google Meet is a SPA, so we need to monitor DOM changes)
    const observer = new MutationObserver(checkCallStatus)

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])

  // Get meeting URL
  const meetingUrl = window.location.href

  if (!inCall || !sidebarVisible) {
    return null
  }

  return <Sidebar meetingUrl={meetingUrl} onClose={() => setSidebarVisible(false)} />
}

export default GoogleMeetAssistant
