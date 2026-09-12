import { redirect } from 'next/navigation';

// Front door: the cinematic poster. The operator deck lives at /command.
export default function Home() {
  redirect('/welcome');
}
