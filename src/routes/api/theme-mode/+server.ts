import type { RequestHandler } from "./$types";

export const POST = (async ({ request, cookies }) => {
  let output = "error";
  const data = await request.json();
  const mode = data?.mode;

  try {
    cookies.set("theme-mode", mode, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 Year consent
    });

    output = "success";
  } catch (e) {
    console.log(e);
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;
