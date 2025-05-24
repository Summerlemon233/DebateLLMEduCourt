// 重试逻辑工具函数
import { DebateError, ErrorCodes } from './error-handler';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 30000, // 30秒
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    // 默认重试条件：网络错误、超时、速率限制
    if (error instanceof DebateError) {
      return [
        ErrorCodes.API_TIMEOUT,
        ErrorCodes.API_NETWORK_ERROR,
        ErrorCodes.API_RATE_LIMIT,
        ErrorCodes.SERVICE_UNAVAILABLE,
      ].includes(error.code as any);
    }
    
    // 检查是否是可重试的HTTP状态码
    const errorObj = error as any;
    if (errorObj.response?.status) {
      const status = errorObj.response.status;
      return status >= 500 || status === 429 || status === 408;
    }
    
    // 检查网络相关错误
    if (errorObj.code) {
      return ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'].includes(errorObj.code);
    }
    
    return false;
  },
};

/**
 * 带指数退避的重试函数
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // 如果不是第一次尝试，记录成功重试
      if (attempt > 0) {
        console.log(`操作在第 ${attempt + 1} 次尝试后成功`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === config.maxRetries) {
        console.error(`操作在 ${config.maxRetries + 1} 次尝试后最终失败:`, lastError.message);
        throw lastError;
      }
      
      // 检查是否应该重试
      if (!config.retryCondition!(lastError)) {
        console.log('错误不符合重试条件，直接抛出:', lastError.message);
        throw lastError;
      }
      
      // 计算延迟时间（指数退避）
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      );
      
      console.log(`第 ${attempt + 1} 次尝试失败，${delay}ms 后重试:`, lastError.message);
      
      // 等待指定时间后重试
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * 异步等待函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 别名：retryWithBackoff 指向 withRetry
 * 为了兼容现有的导入语句
 */
export const retryWithBackoff = withRetry;

/**
 * 带超时的Promise包装
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = '操作超时'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new DebateError(ErrorCodes.API_TIMEOUT, timeoutMessage)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * 批量并行执行with限制并发数
 */
export async function batchExecute<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  concurrency = 3
): Promise<R[]> {
  const results: R[] = [];
  const errors: Array<{ index: number; error: Error }> = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item, batchIndex) => {
      const actualIndex = i + batchIndex;
      try {
        const result = await operation(item, actualIndex);
        results[actualIndex] = result;
      } catch (error) {
        errors.push({ index: actualIndex, error: error as Error });
        console.error(`批量操作项 ${actualIndex} 失败:`, error);
      }
    });
    
    await Promise.all(batchPromises);
  }
  
  // 如果有任何错误，报告但不抛出（允许部分成功）
  if (errors.length > 0) {
    console.warn(`批量操作中有 ${errors.length} 项失败，共 ${items.length} 项`);
  }
  
  return results;
}

/**
 * 创建具有重试能力的函数
 */
export function createRetryableFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  retryOptions?: Partial<RetryOptions>
) {
  return async (...args: T): Promise<R> => {
    return withRetry(() => fn(...args), retryOptions);
  };
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private lastRequest = 0;

  constructor(
    private readonly maxConcurrent: number = 3,
    private readonly minInterval: number = 1000 // 最小间隔时间（毫秒）
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // 确保请求间隔
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequest;
          if (timeSinceLastRequest < this.minInterval) {
            await sleep(this.minInterval - timeSinceLastRequest);
          }
          
          this.lastRequest = Date.now();
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const operation = this.queue.shift()!;
    operation();
  }
}
