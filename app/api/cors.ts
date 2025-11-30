import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function handleCorsPreFlight() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export function corsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}
