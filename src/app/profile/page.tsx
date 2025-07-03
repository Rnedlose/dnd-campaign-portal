'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: session?.user?.id || '',
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    image: session?.user?.image || '',
    bio: (session?.user as SessionUser)?.bio || '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isOwnProfile = session?.user?.id === profile.id;

  const handleSave = async () => {
    if (!isOwnProfile) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          newPassword: newPassword || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      await update(); // Update the session with new data
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      setProfile((prev) => ({ ...prev, image: data.imageUrl }));
      await update(); // Update the session with new image
      toast.success('Profile image updated');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>Profile</CardTitle>
            </div>
            {isOwnProfile && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.image || undefined} />
                <AvatarFallback>
                  {profile.name?.charAt(0) || profile.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              {isEditing && isOwnProfile && (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                {isEditing && isOwnProfile ? (
                  <Input
                    value={profile.name || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={isLoading}
                  />
                ) : (
                  <p className="text-lg">{profile.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-lg">{profile.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Bio</label>
                {isEditing && isOwnProfile ? (
                  <Textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                    disabled={isLoading}
                    rows={4}
                  />
                ) : (
                  <p className="text-lg whitespace-pre-wrap">{profile.bio || 'No bio yet'}</p>
                )}
              </div>

              {isEditing && isOwnProfile && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {isEditing && isOwnProfile && (
                <Button
                  onClick={handleSave}
                  disabled={isLoading || (newPassword !== '' && newPassword !== confirmPassword)}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
