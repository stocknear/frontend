import { redirect } from "@sveltejs/kit";

export const POST = ({ locals, cookies, url }) => {
  // Clear auth store
  locals.pb.authStore.clear();
  locals.user = undefined;
  
  // Determine environment for proper cookie clearing
  const isProduction = url.hostname !== 'localhost' && 
                       !url.hostname.includes('127.0.0.1') &&
                       !url.hostname.includes('192.168.');
  
  // Clear the PocketBase auth cookie with proper settings
  cookies.delete('pb_auth', { 
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction
  });

  redirect(303, "/");
};
