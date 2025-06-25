
import RegisterForm from '@/components/auth/RegisterForm';
import Image from 'next/image';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image 
          src="https://placehold.co/1920x1080.png" 
          alt="Abstract background of letters" 
          layout="fill" 
          objectFit="cover"
          data-ai-hint="letter pattern" 
        />
      </div>
      <div className="relative z-10 flex flex-col items-center w-full">
        <RegisterForm />
      </div>
    </div>
  );
}
