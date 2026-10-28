import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }}) : null;
export async function requireData(promise) {
  const {data,error} = await promise;
  if (error) throw new Error(error.message);
  return data;
}
export async function edgeFunction(name, payload) {
  const {data,error} = await supabase.functions.invoke(name,{body:payload});
  if(error){
    let message=error.message;
    try {const response=await error.context?.json();message=response?.error||response?.message||message;}catch{}
    throw new Error(message);
  }
  if(data?.error) throw new Error(data.error);
  return data;
}
export async function publicProject(token) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-autorizacao?token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {headers:{apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}});
  const data = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||'Projeto não encontrado.');
  return data;
}
