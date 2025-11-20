import { NextResponse } from 'next/server';

type OpenAIErrorType =
    | 'invalid_request_error'
    | 'authentication_error'
    | 'permission_error'
    | 'insufficient_quota'
    | 'not_found_error'
    | 'rate_limit_error'
    | 'server_error';

interface OpenAIErrorBody {
    error: {
        message: string;
        // type: OpenAIErrorType;
        // param: string | null;
        // code: string | null;
    };
}

function mapStatusToOpenAIError(status: number): { type: OpenAIErrorType; code: string | null } {
    switch (status) {
        case 400:
            return { type: 'invalid_request_error', code: 'invalid_request' };
        case 401:
            return { type: 'authentication_error', code: 'invalid_api_key' };
        case 403:
            return { type: 'insufficient_quota', code: 'insufficient_quota' };
        case 404:
            return { type: 'not_found_error', code: 'not_found' };
        case 429:
            return { type: 'rate_limit_error', code: 'rate_limit_exceeded' };
        case 500:
            return { type: 'server_error', code: null };
        case 503:
            return { type: 'server_error', code: 'service_unavailable' };
        default:
            return { type: 'server_error', code: null };
    }
}

export async function codexTemplateResponse(text: string, status: number = 403, opts?: ErrorOptions) {
    const mapped = mapStatusToOpenAIError(status);
    const body: OpenAIErrorBody = {
        error: {
            message: text,                          // 前端直接展示这一段
            // type: mapped.type,   // 错误类型
            // param: null,             // 可指明哪个参数出错
            // code: mapped.code,        // 更细的错误码
        },
    };


    return NextResponse.json(body, {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
    });
}

export async function codexHelloWorldResponse() {
    return await codexTemplateResponse("Hello! How can I help you with your software engineering tasks today? If you're unexpected to see this, pls check your configure.");
}

export async function codexApikeyInvalidResponse() {
    return await codexTemplateResponse("Invalid key! Your api-key is invalid or expired");
}

export async function codexApikey401Response() {
    return await codexTemplateResponse("Unexpected error, pls contact us by email: cfjwlchangji@gmail.com");
}

export async function codexApiLimitExceedResponse() {
    return await codexTemplateResponse("reach the limit of api-key's quota, consider enlarge the quota or upgrade: https://www.codeilab.com/dashboard/api-keys");
}

export async function codexUserLimitExceedResponse() {
    return await codexTemplateResponse("reach the limit of user's quota, consider upgrade your plan: https://www.codeilab.com/dashboard");
}

export async function codexUserSubscriptionInvalidResponse() {
    return await codexTemplateResponse("subscription is invalid, consider update your plan: https://www.codeilab.com/#pricing");
}

export async function codexWrongBaseUrl() {
    return await codexTemplateResponse("wrong parameter! pls check value of your codex_BASE_URL");
}

