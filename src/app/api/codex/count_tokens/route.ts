import { NextRequest, NextResponse } from 'next/server';
import { createHealthCheck } from '@/lib/server/anthropic-proxy';

export async function POST(request: NextRequest) {
  // return createAnthropicProxy(request, {
  //   endpointName: 'messages/count_tokens',
  //   requiresMessagesValidation: true

  // });
  const responseText = `{"input_tokens":1}`;

  return new NextResponse(responseText, {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export const GET = createHealthCheck('messages/count_tokens');