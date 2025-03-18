import type { Session } from 'next-auth';
import { user } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: user
  }
}
