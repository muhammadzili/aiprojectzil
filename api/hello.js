export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY; // Ambil dari env variables
  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const body = req.body; // pesan yang dikirim frontend, misal { messages: [...] }
    
    // Panggil API GROQ dengan API Key
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "Error from GROQ API" });
    }

    // Kirim hasil response ke frontend
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
