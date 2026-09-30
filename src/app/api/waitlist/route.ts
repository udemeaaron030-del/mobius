import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════
// MÖBIUS — Card Waitlist
//
// NOTE: This stores signups in a local JSON file for development.
// Before going to production, swap this for a real provider —
// Mailchimp, ConvertKit, Resend audiences, or your own database —
// so signups survive deploys and you can actually email people.
// ═══════════════════════════════════════════════════

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'waitlist.json');

function readList(): string[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeList(list: string[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address' }, { status: 400 });
    }

    const list = readList();
    if (!list.includes(email)) {
      list.push(email);
      writeList(list);
    }

    return NextResponse.json({ success: true, message: "You're on the list." });
  } catch {
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
