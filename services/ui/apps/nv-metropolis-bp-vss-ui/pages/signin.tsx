import { AuthShell } from '../components/auth/AuthShell';
import { SignInForm } from '../components/auth/SignInForm';

export default function SignInPage() {
  return <AuthShell title="Sign in"><SignInForm /></AuthShell>;
}
