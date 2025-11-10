import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const data = await request.json();
  const ruleOfList = data?.ruleOfList;

  try {
    cookies.set("options-flow-filter-cookie", JSON.stringify(ruleOfList), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 Year
    });
  } catch (e) {
    console.error(e);
  }
  return new Response(JSON.stringify("done"));
};
