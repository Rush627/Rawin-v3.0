import { NextRequest, NextResponse } from "next/server";
import { checkAuraRateLimit } from "@/lib/aura/rate-limit";
import { queryAura } from "@/lib/aura/provider";
import type { AuraMessage } from "@/lib/aura/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";

    const rateLimit = checkAuraRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Orbit is receiving too many inquiries from this connection. Please wait a moment.",
          retryAfter: rateLimit.resetInSeconds,
        },
        { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
      );
    }

    // 2. Body Parsing & Validation
    let body: { messages?: unknown; stream?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request format. Expected JSON payload." },
        { status: 400 }
      );
    }

    const { messages, stream = true } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation messages array is required." },
        { status: 400 }
      );
    }

    if (messages.length > 10) {
      return NextResponse.json(
        { error: "Conversation history exceeds the maximum limit of 10 messages." },
        { status: 400 }
      );
    }

    const sanitizedMessages: AuraMessage[] = [];
    for (const item of messages) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Malformed message object." },
          { status: 400 }
        );
      }
      const { role, content } = item as Record<string, unknown>;
      if (role !== "user" && role !== "assistant") {
        return NextResponse.json(
          { error: "Message role must be either 'user' or 'assistant'." },
          { status: 400 }
        );
      }
      if (typeof content !== "string" || !content.trim()) {
        return NextResponse.json(
          { error: "Message content cannot be empty." },
          { status: 400 }
        );
      }
      if (content.length > 4000) {
        return NextResponse.json(
          { error: "Single message exceeds maximum limit of 4000 characters." },
          { status: 400 }
        );
      }

      sanitizedMessages.push({
        role,
        content: content.trim(),
      });
    }

    const totalChars = sanitizedMessages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars > 16000) {
      return NextResponse.json(
        { error: "Conversation history exceeds the maximum character limit. Please start a new session." },
        { status: 400 }
      );
    }

    // Last message must be from user
    if (sanitizedMessages[sanitizedMessages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "The most recent message in the conversation must come from the user." },
        { status: 400 }
      );
    }

    // 3. Query Aura Provider
    const isStreamRequested = stream !== false;
    const result = await queryAura(sanitizedMessages, isStreamRequested);

    if ("stream" in result) {
      return new Response(result.stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: result.content,
      model: result.model,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("[Aura API] Error executing chat request:", errMessage);

    if (errMessage.startsWith("AURA_CONFIG_MISSING")) {
      return NextResponse.json(
        {
          error:
            "Rawin Orbit is currently operating without active Cloudflare Workers AI credentials. Please configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your environment.",
        },
        { status: 503 }
      );
    }

    if (errMessage.startsWith("AURA_RATE_LIMIT")) {
      return NextResponse.json(
        {
          error: "Rawin Orbit is currently handling peak traffic. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    if (errMessage.startsWith("AURA_TIMEOUT")) {
      return NextResponse.json(
        {
          error: "Rawin Orbit response timed out. Please try your question again.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: "Rawin Orbit is temporarily unavailable. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}
