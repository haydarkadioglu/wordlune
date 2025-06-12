import LoginForm from '@/components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 opacity-10">
        <Image 
          src="https://placehold.co/1920x1080.png" 
          alt="Abstract background" 
          layout="fill" 
          objectFit="cover"
          data-ai-hint="abstract texture" 
        />
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <Image 
            src="https://placehold.co/150x150.png" 
            alt="WordClass Logo" 
            width={100} 
            height={100} 
            className="mb-8 rounded-full shadow-lg"
            data-ai-hint="logo book" 
        />
        <LoginForm />
      </div>
    </div>
  );
}
