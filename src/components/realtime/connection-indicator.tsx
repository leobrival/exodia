'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'

interface ConnectionIndicatorProps {
  className?: string
  showText?: boolean
  showReconnectAttempt?: boolean
}

export function ConnectionIndicator({ 
  className, 
  showText = true, 
  showReconnectAttempt = false 
}: ConnectionIndicatorProps) {
  const { 
    connectionStatus, 
    isConnected, 
    isConnecting, 
    isDisconnected, 
    hasError,
    reconnectAttempt,
    isReconnecting 
  } = useConnectionStatus()

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500'
    if (isConnecting || isReconnecting) return 'bg-yellow-500'
    if (hasError) return 'bg-red-500'
    return 'bg-muted-foreground'
  }

  const getStatusText = () => {
    if (isConnected) return 'Connected'
    if (isConnecting) return 'Connecting...'
    if (isReconnecting) return `Reconnecting... (${reconnectAttempt})`
    if (hasError) return 'Connection Error'
    return 'Disconnected'
  }

  const getBadgeVariant = () => {
    if (isConnected) return 'default'
    if (isConnecting || isReconnecting) return 'secondary'
    if (hasError) return 'destructive'
    return 'outline'
  }

  if (!showText) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div 
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-200',
            getStatusColor()
          )}
          title={getStatusText()}
        />
        {showReconnectAttempt && isReconnecting && reconnectAttempt > 0 && (
          <span className="text-xs text-muted-foreground">
            ({reconnectAttempt})
          </span>
        )}
      </div>
    )
  }

  return (
    <Badge 
      variant={getBadgeVariant()}
      className={cn('flex items-center gap-2 text-xs', className)}
    >
      <div 
        className={cn(
          'w-2 h-2 rounded-full transition-colors duration-200',
          getStatusColor()
        )}
      />
      <span>{getStatusText()}</span>
      {showReconnectAttempt && isReconnecting && reconnectAttempt > 0 && (
        <span className="opacity-75">
          (Attempt {reconnectAttempt})
        </span>
      )}
    </Badge>
  )
}