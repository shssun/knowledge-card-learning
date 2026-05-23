import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 引导内容版本号，改变后老用户也会重新看到引导 */
const ONBOARDING_VERSION = 1

interface UIState {
  isDarkMode: boolean
  sidebarOpen: boolean
  currentView: 'list' | 'grid' | 'timeline'
  hasSeenOnboarding: boolean
  /** 上次看到的引导版本号 */
  onboardingVersion: number
  notification: {
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }
  
  toggleDarkMode: () => void
  setSidebarOpen: (open: boolean) => void
  setCurrentView: (view: 'list' | 'grid' | 'timeline') => void
  markOnboardingSeen: () => void
  resetOnboarding: () => void
  showNotification: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void
  hideNotification: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      sidebarOpen: true,
      currentView: 'grid',
      hasSeenOnboarding: false,
      onboardingVersion: 0,
      notification: {
        open: false,
        message: '',
        severity: 'info',
      },
      
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }))
      },
      
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },
      
      setCurrentView: (view) => {
        set({ currentView: view })
      },

      markOnboardingSeen: () => {
        set({ hasSeenOnboarding: true, onboardingVersion: ONBOARDING_VERSION })
      },

      resetOnboarding: () => {
        set({ hasSeenOnboarding: false, onboardingVersion: 0 })
      },

      showNotification: (message, severity = 'info') => {
        set({
          notification: {
            open: true,
            message,
            severity,
          },
        })
      },
      
      hideNotification: () => {
        set((state) => ({
          notification: {
            ...state.notification,
            open: false,
          },
        }))
      },
    }),
    {
      name: 'zhika-ui-store',
    }
  )
)

export { ONBOARDING_VERSION }
