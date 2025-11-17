import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Column, Button, Text } from '@once-ui-system/core';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedOut>
        <Column maxWidth="m" paddingTop="24" gap="24" horizontal="center">
          <Text variant="heading-strong-xl">Admin Access Required</Text>
          <Text variant="body-default-m" onBackground="neutral-weak">
            Please sign in to access the admin dashboard.
          </Text>
          <SignInButton mode="modal">
            <Button size="l">Sign In</Button>
          </SignInButton>
        </Column>
      </SignedOut>
      <SignedIn>
        {children}
      </SignedIn>
    </>
  );
}
