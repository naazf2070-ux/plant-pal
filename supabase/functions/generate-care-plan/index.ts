import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  garden_item_id: string;
}

interface ReminderPlan {
  title: string;
  message: string;
  days_offset: number; // days from now
  type?: "watering" | "care" | "fertilizing" | "pruning" | "repotting" | "other";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { garden_item_id }: Body = await req.json();
    if (!garden_item_id) {
      return new Response(JSON.stringify({ error: "garden_item_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch garden item + plant via user client (RLS-protected)
    const { data: item, error: itemErr } = await userClient
      .from("garden_items")
      .select("id, user_id, plants(name, latin, description, care_instructions, light_requirements, watering_frequency, soil_type, category, plant_type)")
      .eq("id", garden_item_id)
      .maybeSingle();

    if (itemErr || !item) {
      return new Response(JSON.stringify({ error: "Garden item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (item.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plant = (item as any).plants;

    const systemPrompt = `You are an expert horticulturist. Given a plant, generate a personalized care reminder schedule for the next 30 days. Return ONLY valid JSON in this exact shape:

{
  "watering_interval_days": number,
  "summary": string,
  "reminders": [
    { "title": string, "message": string, "days_offset": number, "type": "watering" | "care" | "fertilizing" | "pruning" | "repotting" | "other" }
  ]
}

Guidelines:
- Generate 4-8 reminders total covering the next 30 days.
- Include recurring watering reminders based on the plant's watering needs (days_offset >= 1).
- Include 1-2 care tips (light check, leaf cleaning, rotation).
- Include 1 fertilizing reminder if appropriate.
- Keep titles short (under 50 chars) with an emoji. Messages should be 1-2 actionable sentences specific to this plant.
- days_offset: number of days from today (1 = tomorrow). Must be between 1 and 30.`;

    const userPrompt = `Plant details:
Name: ${plant?.name}
Latin: ${plant?.latin ?? "unknown"}
Type: ${plant?.plant_type ?? "unknown"} / ${plant?.category ?? ""}
Light: ${plant?.light_requirements ?? "unknown"}
Watering: ${plant?.watering_frequency ?? "unknown"}
Soil: ${plant?.soil_type ?? "unknown"}
Description: ${plant?.description ?? ""}
Care instructions: ${plant?.care_instructions ?? ""}

Generate the care reminder schedule.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
              ? "Rate limit reached. Please try again shortly."
              : status === 402
              ? "AI credits exhausted. Please add credits in Workspace settings."
              : `AI gateway error: ${errText}`,
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { reminders?: ReminderPlan[]; summary?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reminders = Array.isArray(parsed.reminders) ? parsed.reminders : [];
    if (reminders.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, summary: parsed.summary ?? null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert reminders via service role (bypasses RLS — admin-insert policy)
    const admin = createClient(SUPABASE_URL, SERVICE);
    const now = Date.now();
    const rows = reminders
      .filter((r) => r && typeof r.days_offset === "number" && r.title && r.message)
      .slice(0, 12)
      .map((r) => ({
        user_id: user.id,
        created_by: user.id,
        garden_item_id,
        title: r.title.slice(0, 120),
        message: r.message.slice(0, 500),
        due_at: new Date(now + Math.max(1, Math.min(30, r.days_offset)) * 86400000).toISOString(),
      }));

    const { error: insErr, data: inserted } = await admin.from("reminders").insert(rows).select("id");
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ inserted: inserted?.length ?? 0, summary: parsed.summary ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
