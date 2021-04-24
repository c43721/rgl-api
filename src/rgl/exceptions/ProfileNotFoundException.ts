import { HttpException, HttpStatus } from '@nestjs/common';

export default class ProfileNotFoundException extends HttpException {
  constructor(steamId: string, message: string = 'Profile not found') {
    super(
      HttpException.createBody({ data: { statusCode: 200, steamId, message } }),
      HttpStatus.NOT_FOUND,
    );
  }
}
