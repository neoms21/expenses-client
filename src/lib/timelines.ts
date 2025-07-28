import { supabase } from './dbClient';

const fetchTimelines = async () => {
  const { data } = await supabase.from('timeline').select('*');
  return data;
};

export { fetchTimelines };
