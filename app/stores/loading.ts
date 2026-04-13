import { defineStore } from 'pinia'

export interface LoadingTask {
  id: string
  name: string
  progress?: number
  message?: string
  startTime: number
}

export interface LoadingState {
  globalLoading: boolean
  tasks: LoadingTask[]
  overlayVisible: boolean
  overlayMessage: string
}

export const useLoadingStore = defineStore('loading', {
  state: (): LoadingState => ({
    globalLoading: false,
    tasks: [],
    overlayVisible: false,
    overlayMessage: '',
  }),

  getters: {
    isLoading: (state) => state.globalLoading || state.tasks.length > 0,
    hasActiveTasks: (state) => state.tasks.length > 0,
    currentTask: (state) => state.tasks[state.tasks.length - 1] || null,
    totalProgress: (state) => {
      if (state.tasks.length === 0) return 0
      
      const tasksWithProgress = state.tasks.filter(task => task.progress !== undefined)
      if (tasksWithProgress.length === 0) return 0
      
      const totalProgress = tasksWithProgress.reduce((sum, task) => sum + (task.progress || 0), 0)
      return totalProgress / tasksWithProgress.length
    },
    loadingDuration: (state) => {
      const currentTask = state.tasks[state.tasks.length - 1]
      if (!currentTask) return 0
      
      return Date.now() - currentTask.startTime
    },
  },

  actions: {
    setGlobalLoading(loading: boolean, message?: string) {
      this.globalLoading = loading
      
      if (loading && message) {
        this.overlayMessage = message
        this.overlayVisible = true
      } else if (!loading) {
        this.overlayVisible = false
        this.overlayMessage = ''
      }
    },

    startTask(name: string, message?: string): string {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const task: LoadingTask = {
        id,
        name,
        message,
        startTime: Date.now(),
      }
      
      this.tasks.push(task)
      return id
    },

    updateTask(id: string, updates: Partial<Omit<LoadingTask, 'id' | 'startTime'>>) {
      const task = this.tasks.find(t => t.id === id)
      if (task) {
        Object.assign(task, updates)
      }
    },

    finishTask(id: string) {
      const index = this.tasks.findIndex(t => t.id === id)
      if (index > -1) {
        this.tasks.splice(index, 1)
      }
    },

    clearAllTasks() {
      this.tasks = []
    },

    showOverlay(message: string) {
      this.overlayMessage = message
      this.overlayVisible = true
    },

    hideOverlay() {
      this.overlayVisible = false
      this.overlayMessage = ''
    },

    // Utility methods for common loading scenarios
    async withGlobalLoading<T>(
      asyncFn: () => Promise<T>,
      message?: string
    ): Promise<T> {
      this.setGlobalLoading(true, message)
      
      try {
        const result = await asyncFn()
        return result
      } finally {
        this.setGlobalLoading(false)
      }
    },

    async withTask<T>(
      name: string,
      asyncFn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
      initialMessage?: string
    ): Promise<T> {
      const taskId = this.startTask(name, initialMessage)
      
      const updateProgress = (progress: number, message?: string) => {
        this.updateTask(taskId, { progress, message })
      }
      
      try {
        const result = await asyncFn(updateProgress)
        return result
      } finally {
        this.finishTask(taskId)
      }
    },

    // Specific loading methods for common operations
    async loadMenu(): Promise<void> {
      return this.withTask('Loading menu', async (updateProgress) => {
        updateProgress(0, 'Fetching categories...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress(50, 'Loading menu items...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress(100, 'Menu loaded successfully')
      })
    },

    async createOrder(): Promise<void> {
      return this.withTask('Creating order', async (updateProgress) => {
        updateProgress(0, 'Validating order...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress(33, 'Processing payment...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        updateProgress(66, 'Confirming order...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress(100, 'Order created successfully')
      })
    },

    async syncData(): Promise<void> {
      return this.withTask('Syncing data', async (updateProgress) => {
        updateProgress(0, 'Syncing user data...')
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress(25, 'Syncing cart...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress(50, 'Syncing favorites...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress(75, 'Syncing order history...')
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress(100, 'Data synced successfully')
      })
    },
  },
})
