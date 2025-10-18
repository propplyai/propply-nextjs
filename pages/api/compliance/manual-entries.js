/**
 * API Route: /api/compliance/manual-entries
 *
 * Manage manual compliance entries (permits, inspections, certifications, violations)
 */

import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req, res) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient({ req, res });

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle different HTTP methods
    if (req.method === 'GET') {
      return handleGetEntries(req, res, user, supabase);
    } else if (req.method === 'POST') {
      return handleCreateEntry(req, res, user, supabase);
    } else if (req.method === 'PUT') {
      return handleUpdateEntry(req, res, user, supabase);
    } else if (req.method === 'DELETE') {
      return handleDeleteEntry(req, res, user, supabase);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[API /compliance/manual-entries] Error:', error);
    return res.status(500).json({
      error: 'Operation failed',
      message: error.message
    });
  }
}

/**
 * GET - Retrieve manual compliance entries for a property
 */
async function handleGetEntries(req, res, user, supabase) {
  const { property_id, type, category, status } = req.query;

  if (!property_id) {
    return res.status(400).json({ error: 'property_id is required' });
  }

  try {
    // Verify user owns the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', property_id)
      .eq('user_id', user.id)
      .single();

    if (propertyError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Build query
    let query = supabase
      .from('manual_compliance_entries')
      .select('*')
      .eq('property_id', property_id)
      .order('date', { ascending: false });

    // Apply filters
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data: entries, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      entries: entries || []
    });

  } catch (error) {
    console.error('Error fetching manual entries:', error);
    return res.status(500).json({
      error: 'Failed to fetch manual entries',
      message: error.message
    });
  }
}

/**
 * POST - Create a new manual compliance entry
 */
async function handleCreateEntry(req, res, user, supabase) {
  const {
    property_id,
    type,
    category,
    title,
    description,
    date,
    expiration_date,
    status = 'active',
    notes
  } = req.body;

  // Validation
  if (!property_id || !type || !category || !title || !date) {
    return res.status(400).json({
      error: 'Missing required fields: property_id, type, category, title, date'
    });
  }

  // Validate type
  const validTypes = ['permit', 'inspection', 'certification', 'violation'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid type. Must be one of: permit, inspection, certification, violation'
    });
  }

  // Validate status
  const validStatuses = ['active', 'expired', 'pending', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Must be one of: active, expired, pending, completed'
    });
  }

  try {
    // Verify user owns the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address')
      .eq('id', property_id)
      .eq('user_id', user.id)
      .single();

    if (propertyError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Create the entry
    const { data: entry, error } = await supabase
      .from('manual_compliance_entries')
      .insert({
        property_id,
        user_id: user.id,
        type,
        category,
        title,
        description: description || null,
        date,
        expiration_date: expiration_date || null,
        status,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Manual compliance entry created successfully',
      entry
    });

  } catch (error) {
    console.error('Error creating manual entry:', error);
    return res.status(500).json({
      error: 'Failed to create manual entry',
      message: error.message
    });
  }
}

/**
 * PUT - Update an existing manual compliance entry
 */
async function handleUpdateEntry(req, res, user, supabase) {
  const { id } = req.query;
  const {
    type,
    category,
    title,
    description,
    date,
    expiration_date,
    status,
    notes
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Entry ID is required' });
  }

  try {
    // Verify user owns the entry
    const { data: existingEntry, error: fetchError } = await supabase
      .from('manual_compliance_entries')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (expiration_date !== undefined) updateData.expiration_date = expiration_date;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update the entry
    const { data: entry, error } = await supabase
      .from('manual_compliance_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Manual compliance entry updated successfully',
      entry
    });

  } catch (error) {
    console.error('Error updating manual entry:', error);
    return res.status(500).json({
      error: 'Failed to update manual entry',
      message: error.message
    });
  }
}

/**
 * DELETE - Delete a manual compliance entry
 */
async function handleDeleteEntry(req, res, user, supabase) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Entry ID is required' });
  }

  try {
    // Verify user owns the entry and delete it
    const { error } = await supabase
      .from('manual_compliance_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Manual compliance entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting manual entry:', error);
    return res.status(500).json({
      error: 'Failed to delete manual entry',
      message: error.message
    });
  }
}
