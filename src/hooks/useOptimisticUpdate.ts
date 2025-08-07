'use client'

import { useCallback } from 'react'
import { useRealtimeStore, createOptimisticUpdate } from '@/stores/realtime-base'
import { OptimisticUpdate } from '@/types/realtime'

interface UseOptimisticUpdateOptions {
  onConfirm?: (updateId: string) => void
  onRollback?: (updateId: string) => void
  autoConfirmTimeout?: number // Auto-confirm after this many ms if no real update received
}

interface UseOptimisticUpdateReturn {
  pendingUpdates: OptimisticUpdate[]
  addOptimisticUpdate: <T>(type: 'create' | 'update' | 'delete', data: T) => string
  confirmUpdate: (updateId: string) => void
  rollbackUpdate: (updateId: string) => void
  clearAllUpdates: () => void
  hasPendingUpdate: (dataId: string) => boolean
  getPendingUpdate: (updateId: string) => OptimisticUpdate | undefined
}

export function useOptimisticUpdate(
  options: UseOptimisticUpdateOptions = {}
): UseOptimisticUpdateReturn {
  const realtimeStore = useRealtimeStore()

  const addOptimisticUpdate = useCallback(<T>(
    type: 'create' | 'update' | 'delete',
    data: T
  ): string => {
    const update = createOptimisticUpdate(type, data)
    realtimeStore.addOptimisticUpdate(update)

    // Auto-confirm after timeout if specified
    if (options.autoConfirmTimeout) {
      setTimeout(() => {
        const currentUpdate = realtimeStore.pendingUpdates.find(u => u.id === update.id)
        if (currentUpdate && !currentUpdate.confirmed) {
          console.warn(`[OptimisticUpdate] Auto-confirming update ${update.id} after timeout`)
          confirmUpdate(update.id)
        }
      }, options.autoConfirmTimeout)
    }

    return update.id
  }, [realtimeStore, options.autoConfirmTimeout])

  const confirmUpdate = useCallback((updateId: string) => {
    realtimeStore.confirmOptimisticUpdate(updateId)
    options.onConfirm?.(updateId)
  }, [realtimeStore, options.onConfirm])

  const rollbackUpdate = useCallback((updateId: string) => {
    realtimeStore.rollbackOptimisticUpdate(updateId)
    options.onRollback?.(updateId)
  }, [realtimeStore, options.onRollback])

  const clearAllUpdates = useCallback(() => {
    realtimeStore.clearPendingUpdates()
  }, [realtimeStore])

  const hasPendingUpdate = useCallback((dataId: string) => {
    return realtimeStore.pendingUpdates.some(
      update => !update.confirmed && (update.data as any).id === dataId
    )
  }, [realtimeStore.pendingUpdates])

  const getPendingUpdate = useCallback((updateId: string) => {
    return realtimeStore.pendingUpdates.find(update => update.id === updateId)
  }, [realtimeStore.pendingUpdates])

  return {
    pendingUpdates: realtimeStore.pendingUpdates,
    addOptimisticUpdate,
    confirmUpdate,
    rollbackUpdate,
    clearAllUpdates,
    hasPendingUpdate,
    getPendingUpdate,
  }
}