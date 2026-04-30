type LogLevel = "info" | "error";

type BaseLog = {
    timestamp: string;
    level: LogLevel;
    service: string;
    message?: string;
    event?: string;
    requestId?: string | null;
    method?: string;
    path?: string;
    statusCode?: number;
    errorName?: string;
    errorMessage?: string;
    stack?: string;
};

const service = "auth-service";
const isProd = process.env.NODE_ENV === "production";

function emit(log: Omit<BaseLog, "timestamp" | "service">): void {
    const payload: BaseLog = {
        timestamp: new Date().toISOString(),
        service,
        ...log,
    };

    if (payload.level === "error") {
        console.error(JSON.stringify(payload));
        return;
    }

    console.log(JSON.stringify(payload));
}

export function logInfo(message: string): void {
    emit({ level: "info", message });
}

export function logError(log: Omit<BaseLog, "timestamp" | "service" | "level">): void {
    emit({
        level: "error",
        ...log,
        stack: isProd ? undefined : log.stack,
    });
}
