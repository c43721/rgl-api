import { HttpException, HttpStatus } from '@nestjs/common';

export class RglProfileNotFound extends HttpException {
  constructor(steamId: string, message: string = 'Profile not found') {
    super(
      HttpException.createBody({ statusCode: 200, steamId, message }),
      HttpStatus.OK,
    );
  }
}
