import type EntryPoint from './EntryPoint.ts';
import { decrypt } from '../data/encryption.ts';
import { required } from '../lib/common/lang.ts';

const getUserId: EntryPoint = async (services, username) => {
  const users = await services.db.getAllUsers();
  const user = users.find(
    (u) => u.username && decrypt(u.username) === required(username, 'username is required')
  );

  // eslint-disable-next-line no-console
  console.log(user ? `user id is ${user.id}` : `user not found`);
};

export default getUserId;
