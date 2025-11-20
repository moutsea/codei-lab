import { NextRequest, NextResponse } from 'next/server';
import { createCodexProxy, createHealthCheck } from '@/lib/server/anthropic-proxy';

// export async function POST(request: NextRequest) {
//   return createAnthropicProxy(request, {
//     endpointName: 'messages',
//     requiresMessagesValidation: true
//   });
// }

export async function POST(request: NextRequest) {
  try {
    const response = await createCodexProxy(request, {
      endpointName: 'messages',
      requiresMessagesValidation: true
    });

    // 如果满足某些条件，返回 401
    if (response.status >= 400) {
      // console.log(response);
      return response;
      // return new NextResponse(
      //   JSON.stringify(response.body),
      //   { status: 401 }
      // );
    }

    return new NextResponse(response.body, {
      status: 200
    });
  } catch (error) {
    // 捕获异常，返回 500 错误
    console.error('Error processing request:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export const GET = createHealthCheck('messages');