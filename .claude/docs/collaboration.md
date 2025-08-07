# Collaboration Features

## Overview

Exodia enables real-time collaboration on project proposals through presence awareness, live activity feeds, document sharing, and team communication features powered by Supabase Realtime.

## Real-time Presence

### User Presence Tracking

```typescript
interface UserPresence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  status: 'online' | 'away' | 'offline';
  current_page: string;
  last_seen: Date;
  cursor_position?: { x: number; y: number };
}
```

### Presence Hook Implementation

```typescript
// hooks/use-presence.ts
export function usePresence(projectId: string) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !projectId) return;

    const channel = supabase
      .channel(`project:${projectId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as UserPresence[];
        setOnlineUsers(users.filter(u => u.user_id !== user.id));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.full_name || user.email,
            user_avatar: user.user_metadata?.avatar_url,
            status: 'online',
            current_page: window.location.pathname,
            last_seen: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, user]);

  return { onlineUsers };
}
```

## Activity Feed

### Real-time Activity Stream

```typescript
interface ActivityEvent {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  action: ActivityAction;
  resource_type: 'document' | 'message' | 'project' | 'member';
  resource_id: string;
  resource_name: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

type ActivityAction = 
  | 'uploaded'
  | 'shared'
  | 'commented'
  | 'edited'
  | 'deleted'
  | 'joined'
  | 'left';
```

### Activity Component

```typescript
// components/collaboration/activity-feed.tsx
export function ActivityFeed({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  
  useEffect(() => {
    // Subscribe to real-time activity updates
    const channel = supabase
      .channel(`activity:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newActivity = payload.new as ActivityEvent;
        setActivities(prev => [newActivity, ...prev].slice(0, 50));
      })
      .subscribe();

    // Load initial activities
    loadActivities();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId]);

  const loadActivities = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false })
      .limit(20);
    
    if (data) setActivities(data);
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

## Document Collaboration

### Collaborative Cursors

```typescript
// components/collaboration/collaborative-cursors.tsx
export function CollaborativeCursors({ documentId }: { documentId: string }) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  
  useEffect(() => {
    const channel = supabase
      .channel(`cursors:${documentId}`)
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        setCursors(prev => new Map(prev.set(payload.user_id, payload)));
      })
      .on('broadcast', { event: 'cursor-leave' }, ({ payload }) => {
        setCursors(prev => {
          const next = new Map(prev);
          next.delete(payload.user_id);
          return next;
        });
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [documentId]);

  return (
    <>
      {Array.from(cursors.values()).map((cursor) => (
        <CursorIndicator key={cursor.user_id} cursor={cursor} />
      ))}
    </>
  );
}
```

### Live Document Status

```typescript
interface DocumentStatus {
  id: string;
  status: 'idle' | 'editing' | 'processing' | 'error';
  edited_by?: string;
  edited_by_name?: string;
  last_edited: Date;
  lock_expires?: Date;
}
```

## Team Communication

### In-App Messaging

```typescript
// components/collaboration/team-chat.tsx
export function TeamChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const message = payload.new as ChatMessage;
        setMessages(prev => [...prev, message]);
      })
      .subscribe();

    // Load existing messages
    loadMessages();

    return () => channel.unsubscribe();
  }, [projectId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await supabase
      .from('team_messages')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: newMessage,
        message_type: 'text',
      });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      
      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Notification System

### Real-time Notifications

```typescript
interface Notification {
  id: string;
  user_id: string;
  project_id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  read: boolean;
  created_at: Date;
}

type NotificationType = 
  | 'document_shared'
  | 'comment_added'
  | 'mention'
  | 'project_updated'
  | 'member_joined'
  | 'deadline_reminder';
```

### Notification Hook

```typescript
// hooks/use-notifications.ts
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notification = payload.new as Notification;
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          action: notification.action_url ? (
            <ToastAction altText="View">View</ToastAction>
          ) : undefined,
        });
      })
      .subscribe();

    // Load existing notifications
    loadNotifications();

    return () => channel.unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead };
}
```

## Permission-Based Collaboration

### Role-Based Feature Access

```typescript
// utils/collaboration-permissions.ts
export const getCollaborationPermissions = (
  userRole: OrganizationRole,
  isProjectOwner: boolean
) => {
  return {
    canViewPresence: true,
    canSendMessages: true,
    canShareDocuments: userRole === 'admin' || isProjectOwner,
    canMentionUsers: true,
    canManageNotifications: userRole === 'admin' || isProjectOwner,
    canViewActivityFeed: true,
    canExportConversations: userRole === 'admin' || isProjectOwner,
  };
};
```

## Performance Optimization

### Connection Management

```typescript
// utils/realtime-manager.ts
class RealtimeManager {
  private channels = new Map<string, RealtimeChannel>();
  
  subscribe(channelName: string, callbacks: ChannelCallbacks) {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }
    
    const channel = supabase.channel(channelName);
    
    // Add callbacks
    Object.entries(callbacks).forEach(([event, callback]) => {
      channel.on(event as any, callback);
    });
    
    channel.subscribe();
    this.channels.set(channelName, channel);
    
    return channel;
  }
  
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }
  
  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();
```

## Related Documentation

- See [user-management.md](./user-management.md) for role-based permissions
- See [auth.md](./auth.md) for user authentication
- See [database.md](./database.md) for real-time table setup
- See [rag-system.md](./rag-system.md) for collaborative document analysis

This collaboration system creates an engaging, productive environment for team-based project proposal development.