import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CreatePinBody, Pin } from "@/lib/types";
import { getServerSession } from "@/lib/auth";

export async function GET() {
	try {
		const result = await pool.query<Pin>(
			"SELECT id, city, username, lat, lng, created_at, twitch_id, display_name, profile_image_url FROM pins ORDER BY created_at DESC",
		);
		return NextResponse.json(result.rows);
	} catch (err) {
		console.error("[GET /api/pins]", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	if (checkRateLimit(request)) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const session = await getServerSession();
	const sessionUser = session?.user ?? null;

	let body: CreatePinBody;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const { city, username, lat, lng } = body;

	if (
		!city ||
		typeof city !== "string" ||
		city.trim().length === 0 ||
		city.length > 255
	) {
		return NextResponse.json(
			{
				error:
					"city is required and must be a non-empty string under 255 chars",
			},
			{ status: 400 },
		);
	}
	if (
		username !== undefined &&
		(typeof username !== "string" || username.length > 25)
	) {
		return NextResponse.json(
			{ error: "username must be a string of max 25 characters" },
			{ status: 400 },
		);
	}
	if (typeof lat !== "number" || lat < -90 || lat > 90) {
		return NextResponse.json(
			{ error: "lat must be a number between -90 and 90" },
			{ status: 400 },
		);
	}
	if (typeof lng !== "number" || lng < -180 || lng > 180) {
		return NextResponse.json(
			{ error: "lng must be a number between -180 and 180" },
			{ status: 400 },
		);
	}

	const normalizedUsername =
		username && username.trim().length > 0 ? username.trim() : null;

	try {
		const result = await pool.query<Pin>(
			"INSERT INTO pins (city, username, lat, lng, twitch_id, display_name, profile_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
			[city.trim(), normalizedUsername, lat, lng, sessionUser?.id ?? null, sessionUser?.name ?? null, sessionUser?.image ?? null],
		);
		return NextResponse.json(result.rows[0], { status: 201 });
	} catch (err) {
		console.error("[POST /api/pins]", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
