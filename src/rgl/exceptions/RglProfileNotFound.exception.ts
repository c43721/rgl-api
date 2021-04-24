import { HttpException, HttpStatus } from '@nestjs/common';

export class RglProfileNotFound extends HttpException {
  constructor(steamId: string, message: string = 'Profile not found') {
    super(
      HttpException.createBody({ data: { statusCode: 200, steamId, message } }),
      HttpStatus.NOT_FOUND,
    );
  }
}
