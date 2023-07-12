import { Action } from 'routing-controllers';
import { Container } from 'typedi';

import User from '../api/models/User';
import { AuthService } from './AuthService';

export function authorizationChecker(): (
  action: Action,
  roles: any[]
) => Promise<boolean> | boolean {
  const authService = Container.get<AuthService>(AuthService);

  return async function innerAuthorizationChecker(
    action: Action
  ): Promise<boolean> {
    // here you can use request/response objects from action
    // also if decorator defines roles it needs to access the action
    // you can use them to provide granular access check
    // checker must return either boolean (true or false)
    // either promise that resolves a boolean value
    const token = authService.getTokenFromHeader(action.request);
    if (token === undefined) {
      return false;
    }

    // if (token === env.salesforce.apiKey) {
    //     return true;
    // this is how to enable auth to third party
    // }

    const jwtPayload = await authService.validateJwt(token);

    if (jwtPayload === undefined) {
      return false;
    }

    let currentUser;
    if (jwtPayload.userId) {
      // current fix for lambda jwt
      currentUser = await authService.getUser(jwtPayload.userId);
    } else {
      currentUser = new User();
      currentUser._id = jwtPayload.user._id;
    }

    action.request.user = currentUser;
    return true;
  };
}
