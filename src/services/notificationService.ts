import { supabase, getCurrentUserId } from './supabaseClient';

export const notificationService = {
  getNotifications: async () => {
    const userId = getCurrentUserId();
    if (!userId || userId.trim() === '') {
      return { notifications: [] };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[notificationService.getNotifications] Error:', error);
      return { notifications: [] };
    }

    return {
      notifications: (data || []).map((n: any) => ({
        id: n.id,
        orgId: n.org_id,
        recipientId: n.recipient_id,
        senderId: n.sender_id,
        type: n.type,
        title: n.title,
        body: n.body,
        linkUrl: n.link_url,
        isRead: n.is_read,
        readAt: n.read_at,
        createdAt: n.created_at,
      }))
    };
  },

  markAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  markAllAsRead: async () => {
    const userId = getCurrentUserId();
    if (!userId || userId.trim() === '') return { success: true };

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  createNotification: async (payload: {
    orgSlug?: string;
    recipientId?: string;
    senderId?: string;
    type: string;
    title: string;
    body: string;
    linkUrl?: string;
    metadata?: any;
  }) => {
    try {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          id,
          recipient_id: payload.recipientId || null,
          sender_id: payload.senderId || null,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          link_url: payload.linkUrl || null,
          is_read: false,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[notificationService.createNotification] Error:', error);
      }
      return {
        notification: data ? {
          id: data.id,
          orgId: data.org_id,
          recipientId: data.recipient_id,
          senderId: data.sender_id,
          type: data.type,
          title: data.title,
          body: data.body,
          linkUrl: data.link_url,
          isRead: data.is_read,
          readAt: data.read_at,
          createdAt: data.created_at,
        } : null
      };
    } catch (e) {
      console.warn('[notificationService.createNotification] Exception:', e);
      return { notification: null };
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      return { success: true };
    } catch (e) {
      console.warn('[notificationService.deleteNotification] Exception:', e);
      return { success: true };
    }
  },
};
