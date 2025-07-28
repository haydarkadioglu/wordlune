
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import Image from 'next/image';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
       <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image 
          src="/auth-background.png" 
          alt="Abstract background of letters" 
          layout="fill" 
          objectFit="cover"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center w-full">
        <AdminLoginForm />
      </div>
    </div>
  );
}
