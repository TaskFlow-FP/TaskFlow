import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  const { title, description, dueDate } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const daysUntilDue = dueDate 
    ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const prompt = `Analyze task priority (urgent/high/medium/low):
Title: ${title}
Description: ${description || "No description"}
Due: ${dueDate || "No deadline"}${daysUntilDue ? ` (${daysUntilDue} days)` : ""}

Guidelines:
- URGENT: 1-2 days, critical/blocking
- HIGH: 3-7 days, important features/bugs
- MEDIUM: 1-2 weeks, standard tasks
- LOW: Flexible, minor improvements

Return JSON: {"priority":"urgent|high|medium|low","reasoning":"brief explanation","confidence":"high|medium|low","suggestions":["tip1","tip2"]}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```\n?/g, '').trim();
    const data = JSON.parse(text);

    return NextResponse.json({
      priority: data.priority,
      reasoning: data.reasoning,
      confidence: data.confidence,
      suggestions: data.suggestions || [],
    });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
