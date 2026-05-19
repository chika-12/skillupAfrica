import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const error = exception.getError() as {
      statusCode: number;
      message: string;
    };

    const statusCode = error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message ?? 'Internal server error';

    response.status(statusCode).json({
      statusCode,
      message,
    });
  }
}
