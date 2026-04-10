export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { site } = req.body;

  if (!site) {
    return res.status(400).json({ error: "No site provided" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.3",
        input: `
You are a conversion rate optimization expert.

Analyze this website: ${site}

Give a structured report:

1. Website Score (0-100)
2. Conversion Issues (top 3)
3. SEO Issues
4. UX Problems
5. Exact fixes with estimated % improvement
6. Potential revenue increase

Keep it clear, punchy, and high-value.
        `
      })
    });

    const data = await response.json();

    const result =
      data.output?.[0]?.content?.[0]?.text ||
      "Analysis failed";

    res.status(200).json({ result });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}