import { supabase } from './supabase';

export async function rollbackGoals(userId: string) {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Rollback failed:', error);
      return false;
    }

    console.log('Rollback successful');
    return true;
  } catch (err) {
    console.error('Unexpected error during rollback:', err);
    return false;
  }
}
