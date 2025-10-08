/**
 * API Route: /api/marketplace/save
 *
 * Save vendor request or bookmark
 */

import { authHelpers, supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  try {
    // Authenticate user
    const { user, error: authError } = await authHelpers.getUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle different actions
    if (req.method === 'POST') {
      return handleSaveRequest(req, res, user);
    } else if (req.method === 'PUT') {
      return handleUpdateRequest(req, res, user);
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res, user);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[API /marketplace/save] Error:', error);
    return res.status(500).json({
      error: 'Operation failed',
      message: error.message
    });
  }
}

/**
 * POST - Save new vendor request or bookmark
 */
async function handleSaveRequest(req, res, user) {
  const { action, ...data } = req.body;

  if (action === 'bookmark') {
    return saveBookmark(req, res, user, data);
  } else if (action === 'request_quote') {
    return saveQuoteRequest(req, res, user, data);
  } else {
    return res.status(400).json({ error: 'Invalid action. Use "bookmark" or "request_quote"' });
  }
}

/**
 * Save a vendor bookmark
 */
async function saveBookmark(req, res, user, data) {
  const {
    vendor_place_id,
    vendor_name,
    vendor_category,
    vendor_phone,
    vendor_website,
    vendor_address,
    vendor_rating,
    notes
  } = data;

  if (!vendor_place_id || !vendor_name || !vendor_category) {
    return res.status(400).json({
      error: 'Missing required fields: vendor_place_id, vendor_name, vendor_category'
    });
  }

  try {
    // Check if bookmark already exists
    const { data: existing } = await supabase
      .from('marketplace_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('vendor_place_id', vendor_place_id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Vendor already bookmarked',
        bookmark_id: existing.id
      });
    }

    // Create new bookmark
    const { data: bookmark, error } = await supabase
      .from('marketplace_bookmarks')
      .insert({
        user_id: user.id,
        vendor_place_id,
        vendor_name,
        vendor_category,
        vendor_phone,
        vendor_website,
        vendor_address,
        vendor_rating,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[API /marketplace/save] Bookmark created: ${bookmark.id}`);

    return res.status(201).json({
      success: true,
      message: 'Vendor bookmarked successfully',
      bookmark
    });

  } catch (error) {
    console.error('[API /marketplace/save] Bookmark error:', error);
    throw error;
  }
}

/**
 * Save a quote request
 */
async function saveQuoteRequest(req, res, user, data) {
  const {
    property_id,
    report_id,
    vendor_place_id,
    vendor_name,
    vendor_category,
    vendor_phone,
    vendor_website,
    vendor_address,
    vendor_rating,
    notes
  } = data;

  if (!vendor_place_id || !vendor_name || !vendor_category) {
    return res.status(400).json({
      error: 'Missing required fields: vendor_place_id, vendor_name, vendor_category'
    });
  }

  try {
    // Verify property ownership if property_id is provided
    if (property_id) {
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', property_id)
        .eq('user_id', user.id)
        .single();

      if (propError || !property) {
        return res.status(403).json({ error: 'Property not found or access denied' });
      }
    }

    // Create new request
    const { data: request, error } = await supabase
      .from('marketplace_requests')
      .insert({
        user_id: user.id,
        property_id,
        report_id,
        vendor_place_id,
        vendor_name,
        vendor_category,
        vendor_phone,
        vendor_website,
        vendor_address,
        vendor_rating,
        status: 'pending',
        notes
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[API /marketplace/save] Request created: ${request.id}`);

    return res.status(201).json({
      success: true,
      message: 'Quote request saved successfully',
      request
    });

  } catch (error) {
    console.error('[API /marketplace/save] Request error:', error);
    throw error;
  }
}

/**
 * PUT - Update existing request status
 */
async function handleUpdateRequest(req, res, user) {
  const { request_id, status, notes, contact_date, completion_date } = req.body;

  if (!request_id) {
    return res.status(400).json({ error: 'request_id is required' });
  }

  const validStatuses = ['pending', 'contacted', 'hired', 'rejected', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    // Build update object
    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (contact_date) updates.contact_date = contact_date;
    if (completion_date) updates.completion_date = completion_date;

    // Update request
    const { data: request, error } = await supabase
      .from('marketplace_requests')
      .update(updates)
      .eq('id', request_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`[API /marketplace/save] Request updated: ${request_id}`);

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      request
    });

  } catch (error) {
    console.error('[API /marketplace/save] Update error:', error);
    throw error;
  }
}

/**
 * DELETE - Remove bookmark or request
 */
async function handleDelete(req, res, user) {
  const { type, id } = req.query;

  if (!type || !id) {
    return res.status(400).json({ error: 'type and id are required' });
  }

  try {
    if (type === 'bookmark') {
      const { error } = await supabase
        .from('marketplace_bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log(`[API /marketplace/save] Bookmark deleted: ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Bookmark removed successfully'
      });

    } else if (type === 'request') {
      const { error } = await supabase
        .from('marketplace_requests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log(`[API /marketplace/save] Request deleted: ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Request removed successfully'
      });

    } else {
      return res.status(400).json({ error: 'Invalid type. Use "bookmark" or "request"' });
    }

  } catch (error) {
    console.error('[API /marketplace/save] Delete error:', error);
    throw error;
  }
}
