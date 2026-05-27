import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Body {
  imageBase64?: string;
  mimeType?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, notes }: Body = await req.json();
    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "imageBase64 and mimeType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert plant pathologist and horticulturist. Analyze the uploaded plant photo and return a JSON diagnosis. Be honest if the image is not a plant or the picture is unclear. Use the following exact JSON shape and nothing else:

{
  "is_plant": boolean,
  "plant_guess": string | null,
  "healthy": boolean,
  "confidence": "low" | "medium" | "high",
  "disease": { "name": string, "scientific_name": string | null, "summary": string } | null,
  "symptoms": string[],
  "causes": string[],
  "treatment": { "immediate": string[], "ongoing": string[], "organic": string[], "chemical": string[] },
  "prevention": string[],
  "severity": "none" | "mild" | "moderate" | "severe",
  "notes": string
}`;

    const userText = notes?.trim()
      ? `Please diagnose this plant. Additional context from user: ${notes.trim()}`
      : "Please diagnose this plant. Identify any disease, deficiency, or pest issue.";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 502;
      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "Rate limit reached. Please try again in a moment."
              : status === 402
              ? "AI credits exhausted. Please add credits in Workspace settings."
              : `AI gateway error: ${errText}`,
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let diagnosis: unknown;
    try {
      diagnosis = JSON.parse(raw);
    } catch {
      diagnosis = { error: "Could not parse AI response", raw };
    }

    return new Response(JSON.stringify({ diagnosis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
