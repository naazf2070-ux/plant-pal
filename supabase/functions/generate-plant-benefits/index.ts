// Generate plant benefits via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, latin, category, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `List the top benefits of having a "${name}"${latin ? ` (${latin})` : ""}${category ? `, a ${category}` : ""} as a houseplant for the owner.
${description ? `Context: ${description}` : ""}

Return STRICT JSON only (no markdown), with this shape:
{
  "benefits": [
    { "icon": "<one emoji>", "title": "<3-5 words>", "description": "<one short sentence, max 18 words>" }
  ]
}
Provide 4 to 6 benefits covering categories like air quality, wellness/mental health, aesthetics, humidity, productivity, or symbolism — whichever apply.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a botanical wellness expert. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "AI gateway error", details: t }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content ?? "{}";
    content = content.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
