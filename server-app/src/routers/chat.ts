import { z } from 'zod';
import { eq, and, or, desc, gt, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { messages, users } from '../schema.js';

export const chatRouter = router({
  // قائمة المستخدمين للمحادثة
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    return db.query.users.findMany({
      where: and(
        eq(users.orgId, ctx.user.orgId),
        eq(users.isActive, true),
      ),
      columns: { passwordHash: false, orgId: false },
      orderBy: (u, { asc }) => [asc(u.name)],
    });
  }),

  // رسائل المحادثة بين مستخدمين
  getConversation: protectedProcedure
    .input(z.object({ withUserId: z.number(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const msgs = await db.query.messages.findMany({
        where: and(
          eq(messages.orgId, ctx.user.orgId),
          or(
            and(eq(messages.senderId, ctx.user.id), eq(messages.receiverId, input.withUserId)),
            and(eq(messages.senderId, input.withUserId), eq(messages.receiverId, ctx.user.id)),
          ),
        ),
        orderBy: [desc(messages.createdAt)],
        limit: input.limit,
      });
      return msgs.reverse();
    }),

  // إرسال رسالة
  send: protectedProcedure
    .input(z.object({
      receiverId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const [msg] = await db.insert(messages).values({
        orgId: ctx.user.orgId,
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        content: input.content,
      }).returning();
      return msg;
    }),

  // تحديد الرسائل كمقروءة
  markRead: protectedProcedure
    .input(z.object({ fromUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.orgId, ctx.user.orgId),
          eq(messages.receiverId, ctx.user.id),
          eq(messages.senderId, input.fromUserId),
          eq(messages.isRead, false),
        ));
      return { success: true };
    }),

  // عدد الرسائل غير المقروءة
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select({
        senderId: messages.senderId,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(and(
        eq(messages.orgId, ctx.user.orgId),
        eq(messages.receiverId, ctx.user.id),
        eq(messages.isRead, false),
      ))
      .groupBy(messages.senderId);
    return result;
  }),

  // آخر الرسائل (للقائمة الجانبية)
  recentConversations: protectedProcedure.query(async ({ ctx }) => {
    const result = await db.execute(sql`
      SELECT DISTINCT ON (other_user)
        CASE WHEN sender_id = ${ctx.user.id} THEN receiver_id ELSE sender_id END as other_user,
        id, content, sender_id, receiver_id, is_read, created_at
      FROM messages
      WHERE org_id = ${ctx.user.orgId}
        AND (sender_id = ${ctx.user.id} OR receiver_id = ${ctx.user.id})
      ORDER BY other_user, created_at DESC
    `);
    return result.rows as {
      other_user: number;
      id: number;
      content: string;
      sender_id: number;
      receiver_id: number;
      is_read: boolean;
      created_at: string;
    }[];
  }),
});
