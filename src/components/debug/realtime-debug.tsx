'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useRealtimeStore } from '@/stores/realtime-base'
import { useProjectsStore } from '@/stores/projects'
import { ConnectionIndicator } from '@/components/realtime/connection-indicator'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'

interface RealtimeDebugProps {
  className?: string
}

export function RealtimeDebug({ className }: RealtimeDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const realtimeStore = useRealtimeStore()
  const projectsStore = useProjectsStore()
  const connectionStatus = useConnectionStatus()

  if (!isExpanded) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-xs"
        >
          🔧 Debug Real-time
        </Button>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Real-time Debug</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Connection</h4>
          <div className="flex items-center gap-2 mb-2">
            <ConnectionIndicator showReconnectAttempt />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => realtimeStore.syncConnectionStatus()}
              className="text-xs"
            >
              Sync Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => realtimeStore.syncSubscriptions()}
              className="text-xs"
            >
              Sync Subs
            </Button>
          </div>
        </div>

        <Separator />

        {/* Subscriptions */}
        <div>
          <h4 className="text-xs font-semibold mb-2">
            Subscriptions ({realtimeStore.subscriptions.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {realtimeStore.subscriptions.map((sub) => (
              <div key={sub.id} className="text-xs border rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono">{sub.table}</span>
                  <Badge variant="outline" className="text-xs">
                    {sub.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground truncate">
                  ID: {sub.id.slice(-8)}
                </div>
                {sub.lastEvent && (
                  <div className="text-muted-foreground">
                    Last: {new Date(sub.lastEvent).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
            {realtimeStore.subscriptions.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No active subscriptions
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Optimistic Updates */}
        <div>
          <h4 className="text-xs font-semibold mb-2">
            Pending Updates ({realtimeStore.pendingUpdates.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {realtimeStore.pendingUpdates.map((update) => (
              <div key={update.id} className="text-xs border rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {update.type}
                  </Badge>
                  <Badge 
                    variant={update.confirmed ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {update.confirmed ? "Confirmed" : "Pending"}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {realtimeStore.pendingUpdates.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No pending updates
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Projects Store State */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Projects Store</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Real-time enabled:</span>
              <Badge variant={projectsStore.isRealtimeEnabled ? "default" : "secondary"}>
                {projectsStore.isRealtimeEnabled ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Projects:</span>
              <span>{projectsStore.projects.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Organizations:</span>
              <span>{projectsStore.organizations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Loading projects:</span>
              <Badge variant={projectsStore.isLoadingProjects ? "secondary" : "outline"}>
                {projectsStore.isLoadingProjects ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Actions</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => projectsStore.loadProjects()}
              disabled={projectsStore.isLoadingProjects}
              className="text-xs"
            >
              Reload Projects
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => realtimeStore.clearPendingUpdates()}
              disabled={realtimeStore.pendingUpdates.length === 0}
              className="text-xs"
            >
              Clear Updates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}