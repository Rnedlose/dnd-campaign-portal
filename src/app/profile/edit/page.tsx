'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';
import { useUploadThing } from "@/lib/uploadthing";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  hasPassword: boolean;
}

interface UpdateData {
  bio: string | null;
  password?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { startUpload } = useUploadThing("imageUploader");

  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch(`/api/user/${session.user.id}`);
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
  }, [session, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    try {
      const res = await startUpload([file]);
      if (!res?.[0]) throw new Error('Upload failed');

      const response = await fetch(`/api/user/${user.id}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: res[0].url }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      setUser({ ...user, image: data.image });
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updateData: UpdateData = {
        bio: formData.get('bio') as string,
      };

      // Only include password if it's being changed
      if (user.hasPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          setIsSaving(false);
          return;
        }
        updateData.password = newPassword;
      }

      const response = await fetch(`/api/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.push(`/profile/${user.id}`);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center space-y-2">
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Camera className="h-4 w-4" />
                  <span>Change Profile Picture</span>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Read-only Name and Email */}
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </Label>
              <Input id="name" name="name" value={user.name || ''} readOnly className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user.email || ''}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Editable Bio */}
            <div>
              <Label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio
              </Label>
              <Textarea id="bio" name="bio" defaultValue={user.bio || ''} rows={4} />
            </div>

            {/* Password Change Section (only for email/password users) */}
            {user.hasPassword && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <div>
                  <Label htmlFor="new-password" className="block text-sm font-medium mb-1">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/profile/${user.id}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
