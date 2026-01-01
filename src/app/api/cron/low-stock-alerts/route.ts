import { NextRequest, NextResponse } from "next/server";
import { checkAndSendLowStockAlerts } from "@/lib/low-stock-alerts";

// This endpoint can be called by a cron job service (e.g., Vercel Cron, GitHub Actions, etc.)
// Recommended: Run daily at 8:00 AM local time

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await checkAndSendLowStockAlerts();

        return NextResponse.json({
            success: true,
            message: `Low stock alert check completed`,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Low stock cron error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to run low stock check", details: message },
            { status: 500 }
        );
    }
}

// Also allow POST for some cron services
export async function POST(request: NextRequest) {
    return GET(request);
}
