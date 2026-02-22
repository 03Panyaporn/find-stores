import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "กรุณาส่งข้อความ" },
                { status: 400 }
            );
        }

        // TODO: เชื่อมต่อ AI API (OpenAI, etc.)
        // ตอนนี้ใช้ mock response ก่อน
        const reply = `พบร้านฮาจิบัง ราเมน ที่ชั้น 3 โซน A ค่ะ วันนี้มีโปรโมชันพิเศษ 'Double Happiness' รับส่วนลด 20% เมื่อสั่งเมนูเซ็ตนะคะ!`;

        return NextResponse.json({
            role: "ai",
            text: reply,
        });
    } catch {
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในระบบ" },
            { status: 500 }
        );
    }
}
