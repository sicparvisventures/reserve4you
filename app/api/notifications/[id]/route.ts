import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// PATCH - Mark notification as read or update it
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await verifySession();
    const supabase = await createServiceClient();
    const { id } = await context.params;
    const body = await request.json();

    const updates: any = {};

    if (body.read !== undefined) {
      updates.read = body.read;
      if (body.read === true) {
        updates.read_at = new Date().toISOString();
      }
    }

    if (body.archived !== undefined) {
      updates.archived = body.archived;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('Notification PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await verifySession();
    const supabase = await createServiceClient();
    const { id } = await context.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', session.userId);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

