import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { message, sessionId } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "กรุณาส่งข้อความ" },
                { status: 400 }
            );
        }

        // นำ URL Webhook ของ n8n มาใส่ที่นี่ (เปลี่ยน localhost เป็น URL จริงหาก deploy แล้ว)
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/mall-chat-web";

        // ยิง Request ไปหา n8n Webhook
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId || "default-session", // ส่ง sessionId ไปเพื่อให้ n8n จำบริบทได้
                current_date: new Date().toISOString() // ส่งวันที่ปัจจุบันไปตามที่ System Prompt ของ n8n ต้องการ
            }),
        });

        if (!n8nResponse.ok) {
            throw new Error("Failed to fetch from n8n");
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