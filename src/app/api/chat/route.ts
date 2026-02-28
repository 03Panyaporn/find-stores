import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 30_000; // 30 seconds timeout

export async function POST(req: NextRequest) {
    try {
        const body: unknown = await req.json();

        // Validate request body
        if (
            !body ||
            typeof body !== "object" ||
            !("message" in body) ||
            typeof (body as Record<string, unknown>).message !== "string"
        ) {
            return NextResponse.json(
                { error: "กรุณาส่งข้อความ" },
                { status: 400 }
            );
        }

        const { message, sessionId } = body as { message: string; sessionId?: string };

        // อ่าน URL จาก .env.local เท่านั้น
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
        if (!N8N_WEBHOOK_URL) {
            return NextResponse.json(
                { error: "กรุณาตั้งค่า N8N_WEBHOOK_URL ใน .env.local" },
                { status: 500 }
            );
        }

        // ยิง Request ไปหา n8n Webhook (พร้อม timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let n8nResponse: Response;
        try {
            n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: sessionId || "default-session",
                    current_date: new Date().toISOString(),
                }),
                signal: controller.signal,
            });
        } catch (error: unknown) {
            if (error instanceof Error && error.name === "AbortError") {
                return NextResponse.json(
                    { error: "n8n ไม่ตอบสนองภายในเวลาที่กำหนด กรุณาลองใหม่อีกครั้ง" },
                    { status: 504 }
                );
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }

        if (!n8nResponse.ok) {
            throw new Error(`n8n responded with status ${n8nResponse.status}`);
        }

        // รับค่าจาก n8n — ใช้ .text() เพราะ n8n อาจส่ง body ว่าง หรือห่อด้วย ```json```
        const rawText = await n8nResponse.text();

        // ถ้า n8n ตอบกลับมาเปล่า (เช่น Gemini ติด rate limit)
        if (!rawText || rawText.trim() === "") {
            return NextResponse.json({
                ai_reply: "ขออภัยค่ะ ระบบไม่ได้ตอบกลับ กรุณาลองใหม่อีกครั้งนะคะ",
                stores: [],
                quick_replies: [],
            });
        }

        // Strip markdown code block wrapper ถ้ามี
        let cleaned = rawText.trim();
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            cleaned = codeBlockMatch[1].trim();
        }

        try {
            const data = JSON.parse(cleaned);
            return NextResponse.json(data);
        } catch {
            // ถ้า parse ไม่ได้ ส่ง raw text เป็น ai_reply
            return NextResponse.json({
                ai_reply: cleaned,
                stores: [],
                quick_replies: [],
            });
        }
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในระบบ หรือ n8n ไม่ตอบสนอง" },
            { status: 500 }
        );
    }
}