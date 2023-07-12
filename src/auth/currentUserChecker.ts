import { Action } from 'routing-controllers';
import { UserType } from '../types';

export function currentUserChecker(): (
  action: Action
) => Promise<UserType | undefined> {
  return async function innerCurrentUserChecker(
    action: Action
  ): Promise<UserType | undefined> {
    return action.request.user;
  };
}
