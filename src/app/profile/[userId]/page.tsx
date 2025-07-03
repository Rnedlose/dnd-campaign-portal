import { Suspense } from 'react';
import ProfileContent from './profile-content';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

// Notice the params type is now a Promise!
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Profile - ${userId}`,
    description: 'View and edit your profile',
  };
}

// Same for the Page function props
type PageParams = Promise<{ userId: string }>;

export default async function Page({
  params,
}: {
  params: PageParams;
}) {
  const session = await getServerSession(authOptions);
  const { userId } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent userId={userId} />
    </Suspense>
  );
}

