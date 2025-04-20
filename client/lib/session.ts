"use server"
import { cookies } from "next/headers";

export const getSession = async () => {
  const cookieStore = await cookies();
  const session =  await cookieStore.get('webauthn.token');
  if(!session) return null;
  return session;
}

export const setSession = async (session: string, expires: Date) => {
  const cookieStore = await cookies();
  cookieStore.set('webauthn.token', session, { expires });
}

export const deleteSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('webauthn.token');
}