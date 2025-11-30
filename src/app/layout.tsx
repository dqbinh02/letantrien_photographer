import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";
import "@/resources/custom.css";

import classNames from "classnames";
import { Background, Column, Flex, Meta, RevealFx } from "@once-ui-system/core";
import type { opacity, SpacingToken } from "@once-ui-system/core";
import { Footer, Header, Providers, ThemeInitScript } from "@/components";
import { baseURL, effects, fonts } from "@/resources";
import { ClerkProvider } from '@clerk/nextjs';

export async function generateMetadata() {
  return Meta.generate({
    title: "Photographer",
    description: "A photographer website with album management and gallery",
    baseURL: baseURL,
    path: "/",
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fallback key to prevent build errors if env var is missing
  // This allows the app to build but auth won't work without the real key
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html
        suppressHydrationWarning
        lang="en"
        data-theme="light"
        className={classNames(
          fonts.heading.variable,
          fonts.body.variable,
          fonts.label.variable,
          fonts.code.variable,
        )}
      >
      <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <Providers>
          <ThemeInitScript />
          <Column
            background="page"
            fillWidth
            style={{ minHeight: "100vh" }}
            margin="0"
            padding="0"
            horizontal="center"
          >
            <RevealFx fill position="absolute">
              <Background
                mask={{
                  x: effects.mask.x,
                  y: effects.mask.y,
                  radius: effects.mask.radius,
                  cursor: effects.mask.cursor,
                }}
                gradient={{
                  display: effects.gradient.display,
                  opacity: effects.gradient.opacity as opacity,
                  x: effects.gradient.x,
                  y: effects.gradient.y,
                  width: effects.gradient.width,
                  height: effects.gradient.height,
                  tilt: effects.gradient.tilt,
                  colorStart: effects.gradient.colorStart,
                  colorEnd: effects.gradient.colorEnd,
                }}
                dots={{
                  display: effects.dots.display,
                  opacity: effects.dots.opacity as opacity,
                  size: effects.dots.size as SpacingToken,
                  color: effects.dots.color,
                }}
                grid={{
                  display: effects.grid.display,
                  opacity: effects.grid.opacity as opacity,
                  color: effects.grid.color,
                  width: effects.grid.width,
                  height: effects.grid.height,
                }}
                lines={{
                  display: effects.lines.display,
                  opacity: effects.lines.opacity as opacity,
                  size: effects.lines.size as SpacingToken,
                  thickness: effects.lines.thickness,
                  angle: effects.lines.angle,
                  color: effects.lines.color,
                }}
              />
            </RevealFx>
            <Header />
            <Flex 
              zIndex={0} 
              fillWidth 
              padding="l" 
              horizontal="center" 
              flex={1}
              className="main-content-wrapper"
            >
              <Flex horizontal="center" fillWidth minHeight="0">
                {children}
              </Flex>
            </Flex>
            <Footer />
          </Column>
        </Providers>
      </body>
    </html>
    </ClerkProvider>
  );
}
