# Authentication Error Fix - 400 & 406 Errors

## Problem Summary

Your application was experiencing two critical authentication errors:

### 1. **400 Bad Request on `/auth/v1/token?grant_type=pkce`**
- **Cause**: PKCE (Proof Key for Code Exchange) token refresh failures
- **When**: Browser back button navigation or stale session restoration
- **Impact**: Auth session becomes corrupted and cannot refresh

### 2. **406 Not Acceptable on `/rest/v1/properties`**
- **Cause**: Database API requests made without valid authentication
- **When**: After auth failure, page still attempts data queries
- **Impact**: Database queries fail because they lack proper auth headers

## Root Cause

The error flow was:
1. User views compliance report → navigates away
2. User clicks browser **back button**
3. Browser attempts to restore page state
4. Session tries to refresh with stale PKCE verifier → **400 error**
5. Auth is now invalid, but page still queries database → **406 error**

## Changes Made

### 1. **Enhanced Supabase Client Configuration** (`lib/supabase.js`)

```javascript
// Added explicit cookie configuration
cookieOptions: {
  name: 'sb-auth-token',
  lifetime: 60 * 60 * 24 * 7, // 7 days
  domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
  path: '/',
  sameSite: 'lax',
}

// Added auth state change listener for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth state changed:', event);
});
```

### 2. **Improved `getUser()` Method with Session Validation**

```javascript
async getUser() {
  // First check if we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('[Auth] Session error:', sessionError);
    await supabase.auth.signOut(); // Clear corrupted session
    return { user: null, error: sessionError };
  }
  
  if (!session) {
    return { user: null, error: null };
  }
  
  // Only fetch user if we have valid session
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    await supabase.auth.signOut(); // Clear on error
    return { user: null, error };
  }
  
  return { user, error: null };
}
```

### 3. **Enhanced Auth Check in Pages**

Both `/pages/compliance/[id].js` and `/pages/properties/[id].js` now:

```javascript
const checkAuth = async () => {
  const { user: currentUser, error: authError } = await authHelpers.getUser();
  
  // Handle auth errors explicitly
  if (authError || !currentUser) {
    console.log('[Page] Auth failed, redirecting to login');
    setTimeout(() => {
      router.push('/login');
    }, 100);
    return;
  }
  
  // Only proceed if auth successful
  setUser(currentUser);
  await loadData(id, currentUser.id);
};
```

### 4. **Session Validation Before Database Queries**

```javascript
const loadReport = async (reportId, userId) => {
  // Verify session exists before querying
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No valid session');
  }
  
  // Now query database
  const { data, error } = await supabase
    .from('nyc_compliance_reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();
  
  // Handle 406 errors explicitly
  if (error?.status === 406) {
    console.error('[Page] 406 Not Acceptable - auth issue');
    throw new Error('Authentication issue - please try logging in again');
  }
};
```

## How This Fixes the Issue

1. **Prevents 400 Errors**:
   - Validates session before attempting any operations
   - Clears corrupted sessions immediately
   - Redirects to login before stale auth can cause PKCE failures

2. **Prevents 406 Errors**:
   - Checks for valid session BEFORE making database queries
   - Detects 406 errors and provides clear error messages
   - Redirects to login instead of attempting queries with invalid auth

3. **Better Error Recovery**:
   - Auth state listener tracks session changes
   - Explicit error handling at every auth checkpoint
   - Graceful redirects with user feedback

## Testing

To verify the fix:

1. **Login to the app**
2. **Navigate to a property detail page**
3. **Click to generate/view compliance report**
4. **Use browser back button**
5. **Verify**: Should either load properly OR redirect to login cleanly
6. **Check browser console**: Should see clear auth logs instead of 400/406 errors

## Expected Behavior

### Before Fix:
- ❌ 400 PKCE token errors
- ❌ 406 Not Acceptable errors
- ❌ Blank pages or loading spinners
- ❌ Confusing error states

### After Fix:
- ✅ Clean session validation
- ✅ Graceful redirect to login when auth fails
- ✅ Clear console logging for debugging
- ✅ No more 400/406 errors on back button navigation

## Additional Notes

- The fix is **defensive**: it validates auth at multiple checkpoints
- Sessions are automatically cleared if corrupted
- The 100ms timeout before redirects prevents race conditions
- Comprehensive console logging helps debug any future auth issues

## If Issues Persist

If you still see errors:

1. **Clear browser cookies and local storage**
2. **Log out and log back in**
3. **Check Supabase dashboard** for any RLS policy issues
4. **Verify environment variables** are set correctly
5. **Check console logs** for specific error messages

The enhanced logging will show exactly where auth is failing.
