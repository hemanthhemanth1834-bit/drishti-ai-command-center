import { redirect } from 'next/navigation';

// /command is the canonical ops alias for the Master Command Center.
export default function CommandAlias() {
  redirect('/');
}
