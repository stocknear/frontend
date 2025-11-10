import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
    const { pb } = locals;
  const data = await request.json();

      const watchListId = data?.watchListId
    let output;

     try {
        await pb.collection("watchlist").delete(watchListId)
        output = 'success';
    }
    catch(e) {
        //console.log(e)
        output = 'failure';
    }

  return new Response(JSON.stringify(output));
};
