import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as SteamID from 'steamid';

export function IsSteamIdArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSteamId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(idArray: string[], args: ValidationArguments) {
          const idObjects = idArray.map(id => new SteamID(id));
          const hasBadIds = idObjects.every(id => id.isValid());
          return hasBadIds;
        },
        defaultMessage(args: ValidationArguments) {
          return `all ids must be valid`;
        },
      },
    });
  };
}
