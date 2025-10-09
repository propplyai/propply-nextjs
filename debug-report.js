// Debug script to check compliance report
// Run this in browser console on the compliance page

(async () => {
  const reportId = 'b7f37bdd-5ddb-4583-acac-932509a3d753';
  const userId = 'f72ef7f2-c130-4fc0-9493-742fa0a8f2e6';

  console.log('=== Debugging Compliance Report ===');
  console.log('Report ID:', reportId);
  console.log('User ID:', userId);

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('\n1. Session Check:');
  console.log('  Session exists:', !!session);
  console.log('  Session user:', session?.user?.id);
  console.log('  Session error:', sessionError);

  // Try to fetch the report
  console.log('\n2. Fetching report with user filter:');
  const { data, error } = await supabase
    .from('compliance_reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();

  console.log('  Data:', data);
  console.log('  Error:', error);

  // Try without user filter
  console.log('\n3. Fetching report WITHOUT user filter:');
  const { data: data2, error: error2 } = await supabase
    .from('compliance_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  console.log('  Data:', data2);
  console.log('  Error:', error2);

  // Check all reports for this user
  console.log('\n4. All reports for this user:');
  const { data: allReports, error: error3 } = await supabase
    .from('compliance_reports')
    .select('id, address, created_at, user_id')
    .eq('user_id', userId)
    .limit(10);

  console.log('  Count:', allReports?.length);
  console.log('  Reports:', allReports);
  console.log('  Error:', error3);
})();
