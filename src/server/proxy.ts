// src/server/proxy.ts
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxy =
    process.env.NODE_ENV === "development"
        ? process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY
        : undefined;

if (proxy) {
    setGlobalDispatcher(new ProxyAgent(proxy));
    console.log("[proxy] undici ProxyAgent enabled:", proxy);
} else {
    console.log("[proxy] proxy disabled (production)");
}
