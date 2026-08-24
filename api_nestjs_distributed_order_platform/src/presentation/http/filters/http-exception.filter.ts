// presentation/http/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Response, Request } from 'express';
  
  // 👇 SEM argumentos no @Catch() para pegar TUDO (HttpException, Error, etc)
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      // 1. Define valores padrão (genérico -> 500)
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let errorDetails: any = null;
  
      // 2. Verifica se é uma exceção HTTP do NestJS (já tem status)
      if (exception instanceof HttpException) {
        statusCode = exception.getStatus();
        const res = exception.getResponse();
  
        // O NestJS pode retornar string ou objeto
        if (typeof res === 'string') {
          message = res;
        } else if (typeof res === 'object' && res !== null) {
          // Extrai a mensagem principal, se existir
          if ('message' in res) {
            message = Array.isArray(res.message as string[]) 
              ? (res.message as string[]).join(', ') // Validação de DTO (class-validator) vem em array
              : (res.message as string[])[0];
          }
          // Guarda os detalhes extras (ex: { error: 'Bad Request', code: '...' })
          errorDetails = res;
        }
      } 
      // 3. Verifica se é um erro nativo do JS (Domínio/Infra)
      else if (exception instanceof Error) {
        // Em desenvolvimento, podemos usar a mensagem exata
        // Em produção, substituímos por "Internal server error" para não vazar detalhes
        if (process.env.NODE_ENV !== 'production') {
          message = exception.message;
        } else {
          message = 'Internal server error';
        }
        // Guarda o erro original para logs internos (opcional)
        errorDetails = { name: exception.name };
      } 
      // 4. Caso alguém jogue throw "string" ou throw 123
      else {
        message = String(exception);
      }
  
      // 5. Monta o JSON de resposta PADRÃO (exigido pelo time)
      const responseBody: any = {
        statusCode: statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: message,
      };
  
      // Se houver detalhes extras e NÃO for 500 (ou for dev), adiciona ao body
      if (errorDetails && statusCode !== HttpStatus.INTERNAL_SERVER_ERROR) {
        // Para erros 400 (Bad Request), geralmente queremos mostrar os detalhes da validação
        if (typeof errorDetails === 'object' && 'error' in errorDetails) {
          responseBody.error = errorDetails.error;
        }
        // Se houver um 'code' de domínio (ex: 'STOCK_INSUFFICIENT'), adiciona
        if (typeof errorDetails === 'object' && 'code' in errorDetails) {
          responseBody.code = errorDetails.code;
        }
      }
  
      // 6. SEGURANÇA: Só exibe stack trace em desenvolvimento (NÃO em produção!)
      if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
        responseBody.stack = exception.stack;
      }
  
      // 7. Retorna a resposta
      response.status(statusCode).json(responseBody);
    }
  }