/**
 * Review Reply API Endpoints
 * 
 * POST: Create or update owner reply to a review
 * DELETE: Delete owner reply
 */

import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/dal';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/reviews/[reviewId]/reply - Create/update reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await verifySession();
    const { reviewId } = await params;
    const body = await request.json();
    const { comment } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get review and location
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        id,
        location_id,
        location:locations(
          id,
          tenant_id,
          name
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is owner/manager of the location
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', (review.location as any).tenant_id)
      .eq('user_id', session.userId)
      .in('role', ['OWNER', 'MANAGER'])
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if reply already exists
    const { data: existingReply } = await supabase
      .from('review_replies')
      .select('id')
      .eq('review_id', reviewId)
      .single();

    let reply;
    if (existingReply) {
      // Update existing reply
      const { data, error } = await supabase
        .from('review_replies')
        .update({
          comment: comment.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReply.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating reply:', error);
        return NextResponse.json(
          { error: 'Failed to update reply' },
          { status: 500 }
        );
      }

      reply = data;
    } else {
      // Create new reply
      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: session.userId,
          comment: comment.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json(
          { error: 'Failed to create reply' },
          { status: 500 }
        );
      }

      reply = data;

      // Create notification for review author
      try {
        const { data: reviewWithConsumer } = await supabase
          .from('reviews')
          .select(`
            consumer:consumers(
              auth_user_id
            )
          `)
          .eq('id', reviewId)
          .single();

        if (reviewWithConsumer?.consumer?.auth_user_id) {
          await supabase.from('notifications').insert({
            user_id: (reviewWithConsumer.consumer as any).auth_user_id,
            type: 'REVIEW_REPLY',
            title: 'Reactie op je review',
            message: `${(review.location as any).name} heeft gereageerd op je review`,
            action_url: `/p/${(review.location as any).slug}?tab=reviews`, // TODO: Get slug
            metadata: {
              review_id: reviewId,
              location_id: review.location_id,
            },
          });
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the reply creation if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Error in POST /api/reviews/[reviewId]/reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[reviewId]/reply - Delete reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await verifySession();
    const { reviewId } = await params;
    const supabase = await createClient();

    // Get review and location
    const { data: review } = await supabase
      .from('reviews')
      .select(`
        id,
        location:locations(
          tenant_id
        )
      `)
      .eq('id', reviewId)
      .single();

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is owner/manager
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', (review.location as any).tenant_id)
      .eq('user_id', session.userId)
      .in('role', ['OWNER', 'MANAGER'])
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete reply
    const { error } = await supabase
      .from('review_replies')
      .delete()
      .eq('review_id', reviewId);

    if (error) {
      console.error('Error deleting reply:', error);
      return NextResponse.json(
        { error: 'Failed to delete reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in DELETE /api/reviews/[reviewId]/reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

