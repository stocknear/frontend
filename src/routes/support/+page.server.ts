import { error, fail, redirect } from "@sveltejs/kit";

export const actions = {
  support: async ({ locals, request, fetch }) => {
    const { pb } = locals;
    const formData = await request.formData();
    const data = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
    const turnstileToken =
      formData.get("cf-turnstile-response")?.toString() ?? "";

    if (!turnstileToken) {
      return fail(400, {
        data,
        errors: {
          turnstile: ["Please confirm you are not a robot."],
        },
      });
    }

    try {
      const response = await fetch("/api/turnstile", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const verification = await response.json();

      if (!response.ok || !verification?.success) {
        return fail(400, {
          data,
          errors: {
            turnstile: [
              verification?.message ??
                "Turnstile verification failed. Please try again.",
            ],
          },
        });
      }
    } catch (verificationError) {
      console.error("Turnstile verification error:", verificationError);
      return fail(400, {
        data,
        errors: {
          turnstile: [
            "Unable to verify Turnstile response. Please refresh and try again.",
          ],
        },
      });
    }

    const clientIp =
      typeof locals?.clientIp === "string" && locals.clientIp.trim().length > 0
        ? locals.clientIp.trim()
        : undefined;
    
    // Normalize & set category
    const email = String(data.email || "").trim().toLowerCase();
    if (!email) throw error(400, "Email is required.");
    
    data.email = email;
    data.category = "support";
    if (clientIp) {
      data.ipAddress = clientIp;
    }
        
    try {
      // Check recent submissions by same email
      const list = await pb.collection("support").getFullList({
        filter: `email="${email}"`, // Fixed: removed extra quote
        sort: "-created",
      });
     
      if (list?.length > 0) {
        console.log("Rate limit check failed for email:", email); // Fixed: removed extra quote and parenthesis
        throw error(
          429,
          "Rate limit exceeded for this email. Please wait before submitting another request."
        );
      }
      
      await pb.collection("support").create(data);
          return redirect(303, "/support");

    } catch (err: any) {
      if (err?.status) throw err; // rethrow our explicit errors
      throw error(err?.status || 500, err?.message || "Failed to submit support request.");
    }
    
  },
};
