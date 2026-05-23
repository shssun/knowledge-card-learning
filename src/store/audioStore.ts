import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface AudioRecord {
  id: string
  name: string
  domain: string
  /** base64 编码的音频数据，格式如 "data:audio/wav;base64,..." */
  audioData: string
  duration: number // 秒
  createdAt: string
}

interface AudioState {
  /** 所有音频记录 */
  audioList: AudioRecord[]
  /** 当前播放的音频 */
  currentAudio: AudioRecord | null
  isPlaying: boolean
  /** 播放进度（秒） */
  currentTime: number
  volume: number // 0-1

  // Actions
  addAudio: (audio: Omit<AudioRecord, 'id' | 'createdAt'>) => string
  deleteAudio: (id: string) => void
  setCurrentAudio: (audio: AudioRecord | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setVolume: (vol: number) => void
  getAudioByDomain: (domain: string) => AudioRecord[]
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      audioList: [],
      currentAudio: null,
      isPlaying: false,
      currentTime: 0,
      volume: 0.8,

      addAudio: (audio) => {
        const id = uuidv4()
        const newAudio: AudioRecord = {
          ...audio,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          audioList: [newAudio, ...state.audioList],
        }))
        return id
      },

      deleteAudio: (id) => {
        const { currentAudio } = get()
        set((state) => ({
          audioList: state.audioList.filter((a) => a.id !== id),
          currentAudio: currentAudio?.id === id ? null : currentAudio,
          isPlaying: currentAudio?.id === id ? false : state.isPlaying,
        }))
      },

      setCurrentAudio: (audio) => {
        set({ currentAudio: audio, currentTime: 0, isPlaying: false })
      },

      setIsPlaying: (playing) => {
        set({ isPlaying: playing })
      },

      setCurrentTime: (time) => {
        set({ currentTime: time })
      },

      setVolume: (vol) => {
        set({ volume: Math.max(0, Math.min(1, vol)) })
      },

      getAudioByDomain: (domain) => {
        return get().audioList.filter((a) => a.domain === domain)
      },
    }),
    {
      name: 'zhika-audio-store',
    }
  )
)
