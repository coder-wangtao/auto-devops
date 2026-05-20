/**
 * 错误处理中间件
 */
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.path} 不存在`,
  });
}

