import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'OFFICErts is working!',
    timestamp: new Date().toISOString()
  });
}
