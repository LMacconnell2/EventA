export class ServiceError extends Error {
  statusCode: number;
  code?: string;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
  ) {
    super(message);

    this.name = "ServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}