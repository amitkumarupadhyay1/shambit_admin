import { redirect } from 'next/navigation';

export default function HomePage() {
  // Server-side redirect to login page
  redirect('/login');
}
