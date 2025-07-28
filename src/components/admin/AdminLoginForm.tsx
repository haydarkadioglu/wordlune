
"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { getEmailForUsername } from '@/lib/user-service';
import { isAdmin } from '@/lib/admin-service';
import Link from 'next/link';
import Logo from '../common/Logo';

const loginSchema = z.object({
    identifier: z.string().min(1, "Please enter your email or username."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    if (!auth) {
      toast({ title: "Error", description: "Firebase is not configured.", variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    try {
      let email = data.identifier;
      if (!email.includes('@')) {
        const foundEmail = await getEmailForUsername(email);
        if (!foundEmail) {
            toast({ title: "Login Failed", description: "Invalid username or password.", variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        email = foundEmail;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
      
      const userIsAdmin = await isAdmin(userCredential.user);

      if (userIsAdmin) {
        toast({ title: "Success!", description: "Admin login successful." });
        router.push('/admin');
      } else {
        await auth.signOut();
        toast({ title: "Access Denied", description: "You do not have administrative privileges.", variant: 'destructive' });
      }

    } catch (error: any) {
      console.error("Admin Login error:", error);
      toast({ title: "Login Failed", description: "Please check your credentials.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <Logo size="lg" className="justify-center mb-6" />
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
            <Shield className="h-8 w-8" />
            Admin Panel
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in with an administrative account.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="identifier">Email or Username</Label>
          <Input id="identifier" type="text" {...register('identifier')} placeholder="admin@example.com" className="mt-1" />
          {errors.identifier && <p className="mt-1 text-sm text-destructive">{errors.identifier.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="mt-1" />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Not an admin?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Go to user login
        </Link>
      </p>
    </div>
  );
}
