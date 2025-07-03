'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface ProfileContentProps {
  userId: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
}

export default function ProfileContent({ userId }: ProfileContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data);
      } catch {
        toast.error('Failed to load profile');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
              <AvatarFallback>
                {user.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          {user.bio && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Bio</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}
          <div className="mt-4 flex space-x-4">
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            {isOwnProfile && (
              <Button variant="outline" onClick={() => router.push('/profile/edit')}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
