export type TestAuthSession = {
  user: {
    id: string;
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
    email?: string;
  };
};

export function createTestAuthSession(
  userId: string,
  role: TestAuthSession['user']['role'] = 'STUDENT',
): TestAuthSession {
  return {
    user: {
      id: userId,
      role,
      email: `${userId}@test.local`,
    },
  };
}
